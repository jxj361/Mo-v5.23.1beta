// ========== chat.js — 聊天系统 ==========

function sendMessage(text, image = null) {
    if (!currentChatId) { toast("请先选择联系人"); return; }
    const input = document.getElementById('messageInput');
    let richText = '', richImages = [];
    if (!text && !image) {
        input.childNodes.forEach(node => {
            if (node.nodeType === 3) richText += node.textContent;
            else if (node.nodeName === 'IMG') richImages.push(node.src);
        });
    }
    let finalText = text ? sanitizeText(text) : sanitizeText(richText.trim());
    let finalImage = image || (richImages.length ? richImages[0] : null);
    if (!finalText && !finalImage) { toast("内容为空"); return; }
    const isShareMsg = finalText && (finalText.startsWith('🎬') || finalText.startsWith('📖') || finalText.startsWith('🎶'));
    
    let imageId = null;
    if (finalImage && finalImage.startsWith('data:image')) {
        imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        saveMedia(imageId, finalImage);
    }
    
    const msg = { text: finalText, image: imageId || finalImage || null, me: true, time: new Date().toISOString(), senderId: 'me', senderName: appData.myProfile.name };
    if (isShareMsg) msg.type = 'share';
    if (currentQuote) { msg.quote = currentQuote; currentQuote = null; renderQuotePreview(); }
    addMessage(currentChatId, msg);
    appData.lastUserMsgTime[currentChatId] = Date.now();
    if (appData.hiddenChats.includes(currentChatId)) {
        appData.hiddenChats = appData.hiddenChats.filter(id => id !== currentChatId);
    }
    markDataChanged();
    scheduleReply(currentChatId, getContact(currentChatId));
    input.innerHTML = ''; input.placeholder = '输入消息...'; input.focus();
}

function getMsgKey(msg) {
    return (msg.time || '') + '|' + (msg.senderId || '') + '|' + (msg.text || '') + '|' + (msg.image || '') + '|' + (msg.voice || '');
}

function addMessage(chatId, msg) {
    if (!appData.msg[chatId]) appData.msg[chatId] = [];
    if (typeof msg.text === 'string') msg.text = sanitizeText(msg.text);
    if (!msg.senderId && msg.me) msg.senderId = 'me';
    if (!msg.senderId && !msg.me) msg.senderId = chatId;
    if (msg.voice && msg.voiceNote === undefined) msg.voiceNote = '';
    appData.msg[chatId].push(msg);
    markDataChanged();
    save();
    if (currentChatId === chatId) appendMessageToChat(msg);
    else {
        const contact = getContact(chatId);
        if (contact && contact.soundEnabled !== false) {
            ensureAudioContext();
            playSound('message');
        }
    }
    const item = document.getElementById('chatListContainer')?.querySelector(`.chat-item[data-id="${chatId}"]`);
    if (item) {
        const previewEl = item.querySelector('.preview');
        if (previewEl) {
            const lastMsg = (appData.msg[chatId] || []).slice(-1)[0];
            let pt = '';
            if (lastMsg) {
                if (lastMsg.type === 'system' && lastMsg.pokeData) {
                    const from = getContact(lastMsg.pokeData.fromId), to = getContact(lastMsg.pokeData.toId);
                    pt = lastMsg.pokeData.phrase.replace(/\{from\}/g, from ? from.name : lastMsg.pokeData.fromName).replace(/\{to\}/g, to ? to.name : lastMsg.pokeData.toName);
                } else if (lastMsg.voice && !lastMsg.text) pt = '[语音]';
                else if (lastMsg.image && !lastMsg.text) pt = '[图片]';
                else if (lastMsg.text) pt = lastMsg.text;
                else pt = '暂无消息';
            } else pt = '暂无消息';
            previewEl.textContent = pt;
        }
    } else if (!appData.hiddenChats.includes(chatId)) {
        renderChatList();
    }
}

function ensureChatOverlay() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    let overlay = container.querySelector('.chat-body-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'chat-body-overlay';
        overlay.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.3);pointer-events:none;z-index:0;';
        container.appendChild(overlay);
    }
}

function getDayOfWeekStr(date) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return '星期' + days[date.getDay()];
}

function appendMessageToChat(msg, scrollToMsg = false) {
    const container = document.getElementById('chatMessages'), target = getContact(currentChatId);
    const msgDate = new Date(msg.time);
    const ts = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const msgDay = new Date(msgDate); msgDay.setHours(0, 0, 0, 0);
    const lastChild = container.lastElementChild;
    let lastDate = null;
    if (lastChild && lastChild.dataset.msgDay) {
        lastDate = new Date(lastChild.dataset.msgDay);
    }
    if (msgDay.getTime() !== today.getTime() && (!lastDate || msgDay.getTime() !== lastDate.getTime())) {
        const sep = document.createElement('div'); sep.className = 'date-separator';
        sep.dataset.msgDay = msgDay.toISOString();
        const now = new Date();
        let dateText = '';
        const dayStr = getDayOfWeekStr(msgDate);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        if (msgDay.getTime() === yesterday.getTime()) {
            dateText = `${msgDate.getMonth() + 1}月${msgDate.getDate()}日 ${dayStr}`;
        } else if (msgDate.getFullYear() === now.getFullYear()) {
            dateText = `${msgDate.getMonth() + 1}月${msgDate.getDate()}日 ${dayStr}`;
        } else {
            dateText = `${msgDate.getFullYear()}年${msgDate.getMonth() + 1}月${msgDate.getDate()}日 ${dayStr}`;
        }
        sep.innerHTML = `<span>${dateText}</span>`;
        container.appendChild(sep);
    }
    const w = document.createElement('div');
    w.setAttribute('data-msg-time', msg.time);
    if (msg.type === 'system') {
        w.className = 'system-msg';
        if (msg.text && msg.text.startsWith('🌟 ')) {
            w.className = 'system-msg music-share';
            w.textContent = msg.text;
            if (msg.inviteType === 'music') {
                w.onclick = () => {
                    showConfirm('接受听歌邀请？', () => { _musicFromChat = true; openMusicPage(msg.chatId); });
                };
            } else if (msg.text.includes('分享了《')) {
                w.onclick = () => {
                    const songTitle = msg.text.replace(/🌟 .+ 分享了《(.+?)》.*/, '$1');
                    const pl = appData.musicPlaylists[0];
                    if (pl) {
                        const idx = pl.songs.findIndex(s => s.title === songTitle);
                        if (idx >= 0) {
                            musicCurrentPlaylistIndex = 0;
                            musicCurrentSongIndex = idx;
                            _musicFromChat = true;
                            openMusicPage();
                            setTimeout(() => {
                                musicPlayIndex(idx, true);
                                setTimeout(() => {
                                    const items = document.querySelectorAll('.music-item');
                                    if (items[idx]) {
                                        items[idx].classList.add('highlight-flash');
                                        items[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }, 500);
                            }, 300);
                        } else { openMusicPage(); }
                    } else { openMusicPage(); }
                };
            }
        } else if (msg.text && msg.text.startsWith('🎵 分享了一首歌')) {
            w.className = 'system-msg music-share';
            w.textContent = msg.text;
            w.onclick = () => {
                const songTitle = msg.text.replace(/🎵 分享了一首歌《(.+?)》.*/, '$1');
                const pl = appData.musicPlaylists[0];
                if (pl) {
                    const idx = pl.songs.findIndex(s => s.title === songTitle);
                    if (idx >= 0) {
                        musicCurrentPlaylistIndex = 0;
                        musicCurrentSongIndex = idx;
                        _musicFromChat = true;
                        openMusicPage();
                        setTimeout(() => {
                            musicPlayIndex(idx, true);
                            setTimeout(() => {
                                const items = document.querySelectorAll('.music-item');
                                if (items[idx]) {
                                    items[idx].classList.add('highlight-flash');
                                    items[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }, 500);
                        }, 300);
                    } else { openMusicPage(); }
                } else { openMusicPage(); }
            };
        } else if (msg.text && msg.text.startsWith('🎧 ')) {
            w.className = 'system-msg';
            w.textContent = msg.text;
            w.onclick = () => { openMusicPage(); };
        } else if (msg.text && msg.text.startsWith('🎶')) {
            w.className = 'system-msg';
            w.textContent = msg.text;
        } else if (msg.text && msg.text.startsWith('🎬')) {
            w.className = 'system-msg';
            w.textContent = msg.text;
        } else if (msg.text && msg.text.startsWith('📖')) {
            w.className = 'system-msg';
            w.textContent = msg.text;
        } else {
            w.textContent = msg.text;
        }
    } else if (msg.type === 'share') {
        w.className = 'share-msg';
        w.textContent = msg.text;
    } else if (msg.voice) {
        w.className = 'msg-row ' + (msg.me ? 'msg-self' : 'msg-other');
        const a = document.createElement('div'); a.className = 'msg-avatar';
        let avt = '';
        if (msg.me) avt = appData.myProfile.avt;
        else if (msg.senderId) avt = getContact(msg.senderId)?.avt || msg.senderAvt || '';
        else avt = msg.senderAvt || target?.avt || '';
        a.innerHTML = avt ? `<img src="${avt}" onerror="this.parentElement.textContent='${msg.me ? appData.myProfile.name[0] : (msg.senderName || '?')[0]}'">` : (msg.me ? appData.myProfile.name[0] : (msg.senderName || target?.name || '?')[0]);
        a.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (msg.me) openMomentsPage('me', false);
            else if (msg.senderId && msg.senderId !== 'me') openPokePage(currentChatId, 'chat');
        });
        const c = document.createElement('div'); c.className = 'msg-content';
        if (msg.initiative) {
            const tag = document.createElement('div'); tag.className = 'initiative-tag'; tag.textContent = '✨ 主动找你'; c.appendChild(tag);
        }
        if (msg.quote) {
            const q = document.createElement('div'); q.className = 'quote-preview';
            const quotedContact = msg.quote.senderId ? getContact(msg.quote.senderId) : null;
            const quotedName = quotedContact ? quotedContact.name : (msg.quote.senderName || '好友');
            q.innerHTML = `<span>${quotedName}: ${msg.quote.text || '[语音]'}</span><span class="quote-remove">✕</span>`;
            q.querySelector('.quote-remove').onclick = (e) => { e.stopPropagation(); q.remove(); };
            q.addEventListener('click', (e) => {
                if (e.target.classList.contains('quote-remove')) return;
                const time = msg.quote.msgTime;
                if (time) {
                    const targetEl = document.querySelector(`.msg-row[data-msg-time="${time}"]`);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetEl.style.backgroundColor = 'rgba(197,164,126,0.2)';
                        setTimeout(() => targetEl.style.backgroundColor = '', 1500);
                    } else toast('原消息已删除');
                }
            });
            c.appendChild(q);
        }
        const voiceBubble = document.createElement('div');
        voiceBubble.className = 'msg-bubble voice-msg-bubble';
        voiceBubble.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;min-width:80px;position:relative;';
        voiceBubble.innerHTML = `<span style="display:flex;align-items:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('volume-2')}</svg></span><span class="voice-duration-text">${msg.voiceDuration || 0}″</span>`;

        const updateVoiceDuration = async (src) => {
            voiceBubble.setAttribute('data-voice-src', src);
            try {
                const response = await fetch(src);
                const arrayBuffer = await response.arrayBuffer();
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const realDuration = Math.round(audioBuffer.duration) || 1;
                voiceBubble.querySelector('.voice-duration-text').textContent = realDuration + '″';
                voiceBubble.setAttribute('data-voice-duration', realDuration);
                audioCtx.close();
            } catch (e) {
                const fallbackDuration = msg.voiceDuration || (Math.floor(Math.random() * 10) + 2);
                voiceBubble.querySelector('.voice-duration-text').textContent = fallbackDuration + '″';
                voiceBubble.setAttribute('data-voice-duration', fallbackDuration);
            }
        };

        if (msg.voice && msg.voice.startsWith('voice_')) {
            voiceBubble.setAttribute('data-voice-src', '');
            loadMedia(msg.voice).then(data => {
                if (data) updateVoiceDuration(data);
            });
        } else {
            updateVoiceDuration(msg.voice || '');
        }

        voiceBubble.addEventListener('click', (e) => {
            e.stopPropagation();
            const src = voiceBubble.getAttribute('data-voice-src');
            const dur = parseInt(voiceBubble.getAttribute('data-voice-duration')) || 0;
            toggleVoicePlay(voiceBubble, src, dur);
        });
        voiceBubble.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e.clientX, e.clientY, msg, w);
        });
        c.appendChild(voiceBubble);
        if (msg.voiceNote) {
            const noteDiv = document.createElement('div'); noteDiv.className = 'voice-note'; noteDiv.textContent = msg.voiceNote; c.appendChild(noteDiv);
        }
        const tDiv = document.createElement('div'); tDiv.className = 'msg-time'; tDiv.textContent = ts; c.appendChild(tDiv);
        w.appendChild(a); w.appendChild(c);
        w.addEventListener('contextmenu', (e) => { e.preventDefault(); showContextMenu(e.clientX, e.clientY, msg, w); });
    } else {
        w.className = 'msg-row ' + (msg.me ? 'msg-self' : 'msg-other');
        const a = document.createElement('div'); a.className = 'msg-avatar';
        let avt = '';
        if (msg.me) avt = appData.myProfile.avt;
        else if (msg.senderId) avt = getContact(msg.senderId)?.avt || msg.senderAvt || '';
        else avt = msg.senderAvt || target?.avt || '';
        a.innerHTML = avt ? `<img src="${avt}" onerror="this.parentElement.textContent='${msg.me ? appData.myProfile.name[0] : (msg.senderName || '?')[0]}'">` : (msg.me ? appData.myProfile.name[0] : (msg.senderName || target?.name || '?')[0]);
        a.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (msg.me) openMomentsPage('me', false);
            else if (msg.senderId && msg.senderId !== 'me') openPokePage(currentChatId, 'chat');
        });
        const c = document.createElement('div'); c.className = 'msg-content';
        if (msg.initiative) {
            const tag = document.createElement('div'); tag.className = 'initiative-tag'; tag.textContent = '✨ 主动找你'; c.appendChild(tag);
        }
        if (msg.quote) {
            const q = document.createElement('div'); q.className = 'quote-preview';
            const quotedContact = msg.quote.senderId ? getContact(msg.quote.senderId) : null;
            const quotedName = quotedContact ? quotedContact.name : (msg.quote.senderName || '好友');
            q.innerHTML = `<span>${quotedName}: ${msg.quote.text || '[图片]'}</span><span class="quote-remove">✕</span>`;
            q.querySelector('.quote-remove').onclick = (e) => { e.stopPropagation(); q.remove(); };
            q.addEventListener('click', (e) => {
                if (e.target.classList.contains('quote-remove')) return;
                const time = msg.quote.msgTime;
                if (time) {
                    const targetEl = document.querySelector(`.msg-row[data-msg-time="${time}"]`);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetEl.style.backgroundColor = 'rgba(197,164,126,0.2)';
                        setTimeout(() => targetEl.style.backgroundColor = '', 1500);
                    } else toast('原消息已删除');
                }
            });
            c.appendChild(q);
        }
        let imgSrc = msg.image;
        if (imgSrc && !imgSrc.startsWith('data:image') && !imgSrc.startsWith('blob:')) {
            loadMedia(imgSrc).then(data => { if (data) imgSrc = data; });
        }
        if (msg.image && !msg.text) {
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'width:100px;height:100px;background:var(--theme-light);border-radius:4px;display:inline-block;';
            c.appendChild(placeholder);
            if (msg.image.startsWith('img_')) {
                loadMedia(msg.image).then(data => {
                    if (data) {
                        const img = document.createElement('img'); img.className = 'msg-image-only';
                        img.src = data;
                        img.onerror = () => { img.style.display = 'none'; };
                        placeholder.parentNode.replaceChild(img, placeholder);
                    }
                });
            } else if (msg.image.startsWith('data:image')) {
                const img = document.createElement('img'); img.className = 'msg-image-only';
                img.src = msg.image;
                img.onerror = () => { img.style.display = 'none'; };
                placeholder.parentNode.replaceChild(img, placeholder);
            }
        } else {
            const b = document.createElement('div'); b.className = 'msg-bubble'; b.textContent = msg.text || '';
            if (msg.image) {
                const placeholder = document.createElement('div');
                placeholder.style.cssText = 'width:60px;height:60px;background:var(--theme-light);border-radius:4px;display:inline-block;margin-top:4px;';
                b.appendChild(placeholder);
                if (msg.image.startsWith('img_')) {
                    loadMedia(msg.image).then(data => {
                        if (data) {
                            const imgEl = document.createElement('img'); imgEl.className = 'msg-image-inline';
                            imgEl.src = data;
                            imgEl.onerror = () => { imgEl.style.display = 'none'; };
                            placeholder.parentNode.replaceChild(imgEl, placeholder);
                        }
                    });
                } else if (msg.image.startsWith('data:image')) {
                    const imgEl = document.createElement('img'); imgEl.className = 'msg-image-inline';
                    imgEl.src = msg.image;
                    imgEl.onerror = () => { imgEl.style.display = 'none'; };
                    placeholder.parentNode.replaceChild(imgEl, placeholder);
                }
            }
            c.appendChild(b);
        }
        if (!msg.me && target?.members) {
            const n = document.createElement('div'); n.className = 'sender-name';
            const sender = getContact(msg.senderId);
            n.textContent = sender ? sender.name : (msg.senderName || '');
            c.insertBefore(n, c.firstChild);
        }
        const tDiv = document.createElement('div'); tDiv.className = 'msg-time'; tDiv.textContent = ts; c.appendChild(tDiv);
        w.appendChild(a); w.appendChild(c);
        w.addEventListener('contextmenu', (e) => { e.preventDefault(); showContextMenu(e.clientX, e.clientY, msg, w); });
    }
    container.appendChild(w);
    if (scrollToMsg) {
        w.scrollIntoView({ behavior: 'smooth', block: 'center' });
        w.style.backgroundColor = 'rgba(197,164,126,0.2)';
        setTimeout(() => w.style.backgroundColor = '', 1500);
    }
    if (!scrollToMsg) container.scrollTop = container.scrollHeight;
}

function toggleVoicePlay(el, src, duration) {
    if (currentVoicePlayingEl === el && currentVoiceAudio && !currentVoiceAudio.paused) {
        currentVoiceAudio.pause();
        clearInterval(currentVoiceTimer);
        el.classList.remove('voice-playing');
        el.querySelector('.voice-duration-text').textContent = `${duration}″`;
        return;
    }
    if (currentVoiceAudio) {
        currentVoiceAudio.pause();
        if (currentVoicePlayingEl) {
            currentVoicePlayingEl.classList.remove('voice-playing');
            currentVoicePlayingEl.querySelector('.voice-duration-text').textContent = `${currentVoiceDuration}″`;
        }
    }
    clearInterval(currentVoiceTimer);
    currentVoiceAudio = new Audio(src);
    currentVoiceDuration = duration;
    currentVoicePlayingEl = el;
    currentVoiceElapsed = 0;
    el.classList.add('voice-playing');
    el.querySelector('.voice-duration-text').textContent = `${duration}″ (${duration}″)`;
    currentVoiceAudio.play().catch(() => toast('播放失败'));
    currentVoiceTimer = setInterval(() => {
        currentVoiceElapsed++;
        const remaining = Math.max(0, duration - currentVoiceElapsed);
        el.querySelector('.voice-duration-text').textContent = `${duration}″ (${remaining}″)`;
        if (currentVoiceElapsed >= duration) {
            clearInterval(currentVoiceTimer);
            el.classList.remove('voice-playing');
            el.querySelector('.voice-duration-text').textContent = `${duration}″`;
            currentVoicePlayingEl = null;
            currentVoiceAudio = null;
        }
    }, 1000);
    currentVoiceAudio.onended = () => {
        clearInterval(currentVoiceTimer);
        el.classList.remove('voice-playing');
        el.querySelector('.voice-duration-text').textContent = `${duration}″`;
        currentVoicePlayingEl = null;
        currentVoiceAudio = null;
    };
}

function showContextMenu(x, y, msg, element) {
    const menu = document.getElementById('contextMenu'); menu.innerHTML = '';
    const addItem = (text, callback) => {
        const item = document.createElement('div'); item.className = 'context-menu-item'; item.textContent = text;
        item.onclick = () => { callback(); menu.style.display = 'none'; };
        menu.appendChild(item);
    };
    const isFromOther = (msg.senderId && msg.senderId !== 'me') || (!msg.me && msg.senderId !== 'me');
    if (isFromOther && (msg.text || msg.image || msg.voice) && msg.type !== 'system') {
        addItem('引用', () => {
            currentQuote = {
                text: msg.text || (msg.image ? '[图片]' : (msg.voice ? '[语音]' : '')),
                senderName: msg.senderName || getContact(msg.senderId)?.name || '好友',
                senderId: msg.senderId || currentChatId,
                msgTime: msg.time
            };
            document.getElementById('messageInput').placeholder = `引用 ${currentQuote.senderName}`;
            renderQuotePreview();
            toast('已引用，点击发送');
        });
    }
    if (msg.senderId === 'me' || msg.me) {
        addItem('删除', () => {
            showConfirm('删除这条消息？', () => {
                const msgs = appData.msg[currentChatId] || [];
                const idx = msgs.findIndex(m => m.time === msg.time);
                if (idx > -1) msgs.splice(idx, 1);
                markDataChanged(); save(); renderMessages();
            });
        });
    }
    if (msg.voice) {
        addItem('✏️ 添加备注', () => {
            showInputDialog('语音备注', msg.voiceNote || '', (val) => {
                const msgs = appData.msg[currentChatId] || [];
                const found = msgs.find(m => m.time === msg.time);
                if (found) { found.voiceNote = val; markDataChanged(); save(); renderMessages(); toast('备注已保存'); }
            });
        });
    }
    if (menu.children.length) {
        menu.style.display = 'block';
        menu.style.left = Math.min(x, window.innerWidth - 150) + 'px';
        menu.style.top = Math.min(y, window.innerHeight - 100) + 'px';
        const hide = () => { menu.style.display = 'none'; document.removeEventListener('click', hide); };
        setTimeout(() => document.addEventListener('click', hide), 0);
    }
}

function renderQuotePreview() {
    const container = document.getElementById('quotePreviewContainer');
    container.innerHTML = '';
    if (currentQuote) {
        const q = document.createElement('div'); q.className = 'quote-preview';
        const quotedContact = currentQuote.senderId ? getContact(currentQuote.senderId) : null;
        const quotedName = quotedContact ? quotedContact.name : (currentQuote.senderName || '好友');
        q.innerHTML = `<span>${quotedName}: ${currentQuote.text || '[图片]'}</span><span class="quote-remove">✕</span>`;
        q.querySelector('.quote-remove').onclick = () => {
            currentQuote = null;
            document.getElementById('messageInput').innerHTML = '';
            document.getElementById('messageInput').placeholder = '输入消息...';
            renderQuotePreview();
        };
        container.appendChild(q);
    }
}

function renderMessages() {
    const c = document.getElementById('chatMessages');
    while (c.firstChild) c.removeChild(c.firstChild);
    (appData.msg[currentChatId] || []).forEach(m => {
        if (m.text && (m.text.startsWith('data:image/') || m.text.startsWith('data:audio/'))) {
            return;
        }
        appendMessageToChat(m);
    });
    ensureChatOverlay();
    c.scrollTop = c.scrollHeight;
    setTimeout(() => { c.scrollTop = c.scrollHeight; }, 150);
}

function renderEmojiPanel() {
    const p = document.getElementById('emojiPanel'); while (p.firstChild) p.removeChild(p.firstChild);
    const userEmojis = currentChatId ? (appData.userEmo[currentChatId] || []) : [];
    const hidden = currentChatId ? (appData.hiddenGlobalEmojis[currentChatId] || []) : [];
    const globalVisible = appData.globalEmojis.filter(e => !hidden.includes(e));
    globalVisible.forEach(e => {
        const div = document.createElement('div'); div.className = 'emoji-item global-emoji'; div.dataset.val = e;
        const img = document.createElement('img'); img.src = e; div.appendChild(img);
        const del = document.createElement('span'); del.className = 'emoji-delete global-del'; del.textContent = '✕';
        del.onclick = (ev) => {
            ev.stopPropagation();
            showConfirm('隐藏这个全局表情？', () => {
                if (currentChatId) {
                    if (!appData.hiddenGlobalEmojis[currentChatId]) appData.hiddenGlobalEmojis[currentChatId] = [];
                    appData.hiddenGlobalEmojis[currentChatId].push(e);
                    save();
                    renderEmojiPanel();
                }
            });
        };
        div.appendChild(del);
        div.onclick = () => sendMessage('', e);
        p.appendChild(div);
    });
    userEmojis.forEach(e => {
        const div = document.createElement('div'); div.className = 'emoji-item user-emoji'; div.dataset.val = e;
        const img = document.createElement('img'); img.src = e; div.appendChild(img);
        const del = document.createElement('span'); del.className = 'emoji-delete user-del'; del.textContent = '✕';
        del.onclick = (ev) => {
            ev.stopPropagation();
            showConfirm('删除这个专属表情？', () => {
                if (currentChatId && appData.userEmo[currentChatId]) {
                    appData.userEmo[currentChatId] = appData.userEmo[currentChatId].filter(em => em !== e);
                    save();
                    renderEmojiPanel();
                }
            });
        };
        div.appendChild(del);
        div.onclick = () => sendMessage('', e);
        p.appendChild(div);
    });
    const addBtn = document.createElement('div'); addBtn.className = 'emoji-item'; addBtn.id = 'addUserEmojiBtn';
    addBtn.style.cssText = 'font-size:20px;border:1px dashed var(--theme);display:flex;align-items:center;justify-content:center;color:var(--theme);';
    addBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    addBtn.onclick = () => document.getElementById('emojiFile').click();
    p.appendChild(addBtn);
    if (!p.querySelector('.resize-handle')) {
        const handle = document.createElement('div'); handle.className = 'resize-handle';
        handle.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const startY = e.clientY, startHeight = p.offsetHeight;
            const move = (ev) => { const newHeight = startHeight + (ev.clientY - startY); p.style.maxHeight = Math.max(120, Math.min(400, newHeight)) + 'px'; };
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        });
        p.appendChild(handle);
    }
    applyTransparency();
}

function renderImagePanel() {
    const p = document.getElementById('imagePanel'); while (p.firstChild) p.removeChild(p.firstChild);
    const images = currentChatId ? (appData.userImages[currentChatId] || []) : [];
    images.forEach(img => {
        const div = document.createElement('div'); div.className = 'emoji-item image-item'; div.dataset.val = img;
        const image = document.createElement('img'); image.src = img; div.appendChild(image);
        const del = document.createElement('span'); del.className = 'emoji-delete img-del'; del.textContent = '✕';
        del.onclick = (ev) => {
            ev.stopPropagation();
            showConfirm('删除这张图片？', () => {
                if (currentChatId && appData.userImages[currentChatId]) {
                    appData.userImages[currentChatId] = appData.userImages[currentChatId].filter(im => im !== img);
                    save();
                    renderImagePanel();
                }
            });
        };
        div.appendChild(del);
        div.onclick = () => sendMessage('', img);
        p.appendChild(div);
    });
    const addBtn = document.createElement('div'); addBtn.className = 'emoji-item'; addBtn.id = 'addImageBtn';
    addBtn.style.cssText = 'font-size:20px;border:1px dashed var(--theme);display:flex;align-items:center;justify-content:center;color:var(--theme);';
    addBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    addBtn.onclick = () => document.getElementById('imageLibFile').click();
    p.appendChild(addBtn);
    if (!p.querySelector('.resize-handle')) {
        const handle = document.createElement('div'); handle.className = 'resize-handle';
        handle.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const startY = e.clientY, startHeight = p.offsetHeight;
            const move = (ev) => { const newHeight = startHeight + (ev.clientY - startY); p.style.maxHeight = Math.max(120, Math.min(400, newHeight)) + 'px'; };
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
            window.addEventListener('pointermove', move);
            window.addEventListener('pointerup', up);
        });
        p.appendChild(handle);
    }
    applyTransparency();
}

function openChat() {
    const t = getContact(currentChatId);
    if (!t) { toast('联系人不存在'); return; }
    // 打开聊天时，15%概率MJ换一个状态
    if (t && t.id !== 'me' && !t.members && Math.random() < 0.15) {
      const now = Date.now();
      const lastChange = appData.lastStatusChangeTime[t.id] || 0;
      if (now - lastChange > 30 * 60 * 1000) {
        let newStatus;
        do {
          newStatus = STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)];
        } while (newStatus === t.status);
        t.status = newStatus;
        appData.lastStatusChangeTime[t.id] = now;
        markDataChanged();
        save();
      }
    }
    if (appData.hiddenChats.includes(currentChatId)) appData.hiddenChats = appData.hiddenChats.filter(id => id !== currentChatId);
    updateChatTitleReplyIndicator(currentChatId);
    if (currentChatId === 'me') {
        document.getElementById('chatTitle').textContent = appData.myProfile.name;
    }
    updateReplyIndicatorUI(currentChatId);
    document.getElementById('chatMessages').style.backgroundImage = t.bg ? `url(${t.bg})` : 'none';
    document.getElementById('chatMessages').style.backgroundSize = 'cover';
    document.getElementById('chatMessages').style.backgroundRepeat = 'no-repeat';
    document.getElementById('chatMessages').style.backgroundPosition = 'center';
    ensureChatOverlay();
    if (t.members && t.announcement) {
        let announceEl = document.getElementById('groupAnnouncement');
        if (!announceEl) {
            announceEl = document.createElement('div');
            announceEl.id = 'groupAnnouncement';
            announceEl.className = 'group-announcement';
            const chatBody = document.getElementById('chatMessages');
            chatBody.parentNode.insertBefore(announceEl, chatBody);
        }
        announceEl.textContent = t.announcement;
        announceEl.style.display = 'block';
    } else {
        const announceEl = document.getElementById('groupAnnouncement');
        if (announceEl) announceEl.style.display = 'none';
    }
    renderMessages(); renderEmojiPanel(); renderImagePanel();
    document.getElementById('chatPage').classList.add('active');
    document.getElementById('chatsPage').classList.remove('active');
    document.getElementById('messageInput').innerHTML = '';
    document.getElementById('messageInput').placeholder = '输入消息...';
    renderQuotePreview();
    applyTransparency();
    setTimeout(positionFloatBalls, 200);
}

function positionFloatBalls() {
    const callBtn = document.getElementById('callBtn');
    const musicBtn = document.getElementById('musicTriggerBtn');
    const backupBtn = document.getElementById('backupTriggerBtn');
    const ballSize = 55;
    const gap = 10;
    const setBallPos = (btn, ball) => {
        if (!btn || !ball) return;
        if (ball.style.display === 'none' || ball.style.display === '') return;
        const rect = btn.getBoundingClientRect();
        ball.style.left = (rect.left + rect.width / 2 - ballSize / 2) + 'px';
        ball.style.top = (rect.top - ballSize - gap) + 'px';
        ball.style.right = 'auto';
        ball.style.bottom = 'auto';
    };
    setBallPos(callBtn, document.querySelector('.call-float-ball'));
    setBallPos(musicBtn, document.getElementById('musicFloatBall'));
    setBallPos(backupBtn, document.getElementById('backupFloatBall'));
}

function openMyChatMenu() {
    document.querySelectorAll('.mask.show').forEach(m => m.remove());
    const mask = document.getElementById('globalMask');
    while (mask.firstChild) mask.removeChild(mask.firstChild); mask.className = 'mask show';
    const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px';
    const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '菜单';
    const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => mask.classList.remove('show');
    header.appendChild(closeBtn); card.appendChild(header);
    const body = document.createElement('div'); body.className = 'pop-body'; body.style.gap = '6px';
    const btns = [
        { text: '搜索内容', icon: 'search', action: () => { mask.classList.remove('show'); openSearchPage(); } },
        { text: '查看朋友圈', icon: 'sun', action: () => { mask.classList.remove('show'); openMomentsPage('me', true); } },
        { text: '拍一拍设置', icon: 'hand', action: () => { mask.classList.remove('show'); openPokePage('me', 'chat'); } },
        { text: '陪伴系统', icon: 'clock', action: () => { mask.classList.remove('show'); openCompanionPage(); } },
        { text: '一起看电影', icon: 'video', action: () => { mask.classList.remove('show'); openMovieTogetherPage(); } },
        { text: '清空记录', icon: 'trash-2', red: true, action: () => { mask.classList.remove('show'); showConfirm('清空记录？', () => { appData.msg['me'] = []; markDataChanged(); save(); renderMessages(); }); } }
    ];
    btns.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        const isRed = b.red;
        btn.style.cssText = `display:flex;align-items:center;justify-content:center;${isRed ? 'color:#f44336;' : ''}`;
        const strokeColor = isRed ? '#f44336' : 'currentColor';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        btn.onclick = b.action; body.appendChild(btn);
    });
    card.appendChild(body); mask.appendChild(card);
    mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('show'); });
    applyTransparency();
}

function openChatMenu() {
    const target = getContact(currentChatId);
    if (!target || target.id === 'me') {
        if (currentChatId === 'me') openMyChatMenu();
        else toast('这是你自己');
        return;
    }
    document.querySelectorAll('.mask.show').forEach(m => m.remove());
    const mask = document.getElementById('globalMask');
    while (mask.firstChild) mask.removeChild(mask.firstChild); mask.className = 'mask show';
    const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px';
    const header = document.createElement('div'); header.className = 'pop-header';
    const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('x')}</svg>`; closeBtn.onclick = () => mask.classList.remove('show');
    header.appendChild(closeBtn); card.appendChild(header);
    const body = document.createElement('div'); body.className = 'pop-body'; body.style.gap = '6px';
    if (target.members) {
        header.appendChild(document.createTextNode('群聊菜单'));
        const btns = [
            { text: '群设置', icon: 'settings', action: () => { mask.classList.remove('show'); openGroupSettings(target); } },
            { text: '搜索内容', icon: 'search', action: () => { mask.classList.remove('show'); openSearchPage(); } },
            { text: '陪伴系统', icon: 'clock', action: () => { mask.classList.remove('show'); openCompanionPage(); } },
            { text: '一起看电影', icon: 'video', action: () => { mask.classList.remove('show'); openMovieTogetherPage(); } },
            { text: '清空记录', icon: 'trash-2', red: true, action: () => { mask.classList.remove('show'); showConfirm('清空记录？', () => { appData.msg[currentChatId] = []; markDataChanged(); save(); renderMessages(); }); } }
        ];
        btns.forEach(b => {
            const btn = document.createElement('button'); btn.className = 'btn'; const isRed = b.red;
            btn.style.cssText = `display:flex;align-items:center;justify-content:center;${isRed ? 'color:#f44336;' : ''}`;
            const strokeColor = isRed ? '#f44336' : 'currentColor';
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
            btn.onclick = b.action; body.appendChild(btn);
        });
    } else {
        header.appendChild(document.createTextNode('菜单'));
        const btns = [
            { text: '字卡设置', icon: 'book-open', action: () => { mask.classList.remove('show'); openUserCardsPage(currentChatId, 'chat'); } },
            { text: '搜索内容', icon: 'search', action: () => { mask.classList.remove('show'); openSearchPage(); } },
            { text: '查看朋友圈', icon: 'sun', action: () => { mask.classList.remove('show'); currentMomentUserId = currentChatId; openMomentsPage(currentChatId, true); } },
            { text: '拍一拍设置', icon: 'hand', action: () => { mask.classList.remove('show'); openPokePage(currentChatId, 'chat'); } },
            { text: '一起听', icon: 'music', action: () => { mask.classList.remove('show'); _musicFromChat = true; openMusicPage(currentChatId); } },
            { text: '陪伴系统', icon: 'clock', action: () => { mask.classList.remove('show'); openCompanionPage(); } },
            { text: '一起看电影', icon: 'video', action: () => { mask.classList.remove('show'); openMovieTogetherPage(); } },
            { text: '清空记录', icon: 'trash-2', red: true, action: () => { mask.classList.remove('show'); showConfirm('清空记录？', () => { appData.msg[currentChatId] = []; markDataChanged(); save(); renderMessages(); }); } }
        ];
        const u = getContact(currentChatId);
        if (u && u.hideReplyIndicator && (appData.letters[currentChatId] || []).some(l => l.from !== 'me' && !l.read)) {
            btns.push({ text: '显示回信提示', icon: 'mail', action: () => { mask.classList.remove('show'); toggleHideReplyIndicator(currentChatId); } });
        }
        btns.forEach(b => {
            const btn = document.createElement('button'); btn.className = 'btn'; const isRed = b.red;
            btn.style.cssText = `display:flex;align-items:center;justify-content:center;${isRed ? 'color:#f44336;' : ''}`;
            const strokeColor = isRed ? '#f44336' : 'currentColor';
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
            btn.onclick = b.action; body.appendChild(btn);
        });
    }
    card.appendChild(header); card.appendChild(body); mask.appendChild(card);
    mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('show'); });
    applyTransparency();
}

// ========== 回复队列 ==========
function scheduleReply(chatId, target) {
    if (!target || target.noReply || target.id === 'me') return;
    if (target.muted) return;
    const isGroup = !!target.members;
    if (isGroup && target.mutedAll) return;
    const pool = getCardPool(chatId, isGroup, true);
    if (!pool.length) return;
    const rule = target.rule || appData.globalRule;
    const cnt = Math.min(rule.cntMin + Math.floor(Math.random() * (rule.cntMax - rule.cntMin + 1)), 8);
    let delay = 0;
    for (let i = 0; i < cnt; i++) {
        delay += (rule.min + Math.random() * (rule.max - rule.min)) * 1000;
        pendingReplies.push({ chatId, targetTime: Date.now() + delay, target, isGroup, pool });
    }
}

function processReplyQueue() {
    if (pageHiddenTimersPaused) return;
    const now = Date.now();
    for (let i = pendingReplies.length - 1; i >= 0; i--) {
        if (pendingReplies[i].targetTime <= now) {
            const item = pendingReplies.splice(i, 1)[0];
            execReply(item.chatId, item.target, item.isGroup, item.pool);
        }
    }
}
setInterval(processReplyQueue, 1000);

function execReply(chatId, target, isGroup, pool) {
    if (isGroup && target.mutedMembers) {
        const senderId = (isGroup && target.members.length > 1) ?
            target.members.filter(m => m !== 'me')[Math.floor(Math.random() * (target.members.length - 1))] : target.id;
        if (target.mutedMembers[senderId]) return;
    }
    if (!isGroup && appData.userVoices[target.id] && appData.userVoices[target.id].length > 0 && Math.random() < 0.05) {
        const voice = appData.userVoices[target.id][Math.floor(Math.random() * appData.userVoices[target.id].length)];
        const duration = Math.floor(Math.random() * 10) + 2;
        addMessage(chatId, { voice: voice.data, voiceDuration: duration, me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name, senderAvt: target.avt });
        return;
    }
    const combineMin = target.combineMin || appData.globalRule.combineMin || 1;
    const combineMax = target.combineMax || appData.globalRule.combineMax || 3;
    const combineCount = Math.floor(Math.random() * (combineMax - combineMin + 1)) + combineMin;
    
    const cards = [];
    const textOnlyPool = pool.filter(c => !isEmoji(c));
    const finalPool = textOnlyPool.length > 0 ? textOnlyPool : pool;
    for (let i = 0; i < combineCount; i++) {
        cards.push(finalPool[Math.floor(Math.random() * finalPool.length)]);
    }
    let text = cards.join(' ');
    if (appData.limitEmojiPerMsg) {
        const emojiGroupList = (appData.globalCardGroups.find(g => g.name === 'emoji表情')?.list || []);
        const hasEmoji = emojiGroupList.some(e => text.includes(e));
        if (!hasEmoji && Math.random() < 0.7) {
            text += SAFE_EMOJIS[Math.floor(Math.random() * SAFE_EMOJIS.length)];
        }
    } else {
        if (Math.random() < 0.7) {
            const mixCount = 1 + Math.floor(Math.random() * 3);
            for (let j = 0; j < mixCount; j++) {
                text += SAFE_EMOJIS[Math.floor(Math.random() * SAFE_EMOJIS.length)];
            }
        }
    }
    if (text.startsWith('data:image/') || text.startsWith('data:audio/')) {
        text = '嗯嗯';
    }
    if (Math.random() < 0.015) {
        const allSongs = appData.musicPlaylists.flatMap(p => p.songs);
        if (allSongs.length > 0) {
            const song = allSongs[Math.floor(Math.random() * allSongs.length)];
            addMessage(chatId, { text: `🎧 ${target.name} 点歌《${song.title}》${song.sub ? '-' + song.sub : ''}`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name });
            showConfirm(`${target.name} 点歌《${song.title}》，要播放吗？`, () => {
                if (musicAudio) { musicAudio.pause(); musicAudio = null; }
                musicCurrentPlaylistIndex = 0;
                const pl = appData.musicPlaylists[0];
                if (pl) { const idx = pl.songs.findIndex(s => s.title === song.title); if (idx >= 0) { musicCurrentSongIndex = idx; musicPlayIndex(idx, true); } }
            });
            return;
        }
    }
    if (Math.random() < 0.02) {
        const allSongs = appData.musicPlaylists.flatMap(p => p.songs);
        if (allSongs.length > 0) {
            const song = allSongs[Math.floor(Math.random() * allSongs.length)];
            addMessage(chatId, { text: `🌟 ${target.name} 分享了《${song.title}》${song.sub ? '-' + song.sub : ''}`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name });
            return;
        }
    }
    if (Math.random() < 0.01) {
        const allBooks = appData.bookLists.flatMap(l => l.books);
        if (allBooks.length > 0) {
            const book = allBooks[Math.floor(Math.random() * allBooks.length)];
            addMessage(chatId, { text: `🌟 ${target.name} 分享了《${book.title}》${book.author ? '-' + book.author : ''}`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name });
            return;
        }
    }
    if (Math.random() < 0.01) {
        const allMovies = appData.movieLists.flatMap(l => l.movies);
        if (allMovies.length > 0) {
            const movie = allMovies[Math.floor(Math.random() * allMovies.length)];
            addMessage(chatId, { text: `🌟 ${target.name} 分享了《${movie.title}》${movie.year ? '(' + movie.year + ')' : ''}${movie.director ? '- ' + movie.director : ''}`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name });
            return;
        }
    }
    if (Math.random() < 0.01) {
        addMessage(chatId, { text: `🌟 ${target.name} 想和你一起听歌，一起听歌吗？`, type: 'system', me: false, time: new Date().toISOString(), senderId: target.id, senderName: target.name, inviteType: 'music' });
        return;
    }
    if (Math.random() < 0.015) {
        const pokePhrases = appData.globalCardGroups.find(g => g.name === '拍一拍')?.list || POKE_PHRASES;
        const phrase = pokePhrases[Math.floor(Math.random() * pokePhrases.length)];
        let fromId = target.id;
        if (isGroup && target.members.length > 1) { const otherMembers = target.members.filter(m => m !== 'me'); if (otherMembers.length) fromId = otherMembers[Math.floor(Math.random() * otherMembers.length)]; }
        window.pokeUser(chatId, fromId, phrase);
        return;
    }
    
    const msg = { text, me: false, time: new Date().toISOString(), senderName: target.name, senderAvt: target.avt, senderId: target.id };
    if (Math.random() < 0.25) {
        const now = Date.now();
        const userMsgs = (appData.msg[chatId] || []).filter(m => m.me && m.text && (now - new Date(m.time).getTime()) < 24 * 3600000);
        if (userMsgs.length) {
            let quoted = null;
            const history = appData.quoteHistory[target.id] || {};
            const shuffled = userMsgs.slice().sort(() => Math.random() - 0.5);
            for (const candidate of shuffled) {
                if (!history[candidate.time]) {
                    quoted = candidate;
                    break;
                }
            }
            if (!quoted) return;
            if (!appData.quoteHistory[target.id]) appData.quoteHistory[target.id] = {};
            appData.quoteHistory[target.id][quoted.time] = true;
            markDataChanged(); save();
            msg.quote = { text: quoted.text?.substring(0, 50) || '[图片]', senderName: appData.myProfile.name, senderId: 'me', msgTime: quoted.time };
        }
    }
    if (Math.random() < 0.15) {
        const emojiPool = isGroup ? getGroupEmojiPool() : getAllUserEmojis(chatId);
        if (emojiPool.length) {
            const em = emojiPool[Math.floor(Math.random() * emojiPool.length)];
            const testImg = new Image();
            testImg.onload = () => { msg.image = em; msg.text = ''; addMessage(chatId, msg); };
            testImg.onerror = () => { msg.text = text || '嗯嗯'; msg.image = null; addMessage(chatId, msg); };
            testImg.src = em; return;
        }
    }
    if (isGroup && target.members.length > 1) {
        const mems = target.members.filter(m => m !== 'me');
        if (mems.length) {
            const r = getContact(mems[Math.floor(Math.random() * mems.length)]);
            if (r) { msg.senderName = r.name; msg.senderAvt = r.avt; msg.senderId = r.id; }
        }
    }
    addMessage(chatId, msg);
}

function scheduleInitiativeMessages() {
    if (pageHiddenTimersPaused) return;
    const now = Date.now();
    appData.users.forEach(u => {
        if (u.noReply || !u.allowInitiative || u.muted) return;
        if (u.noDisturb) return;
        if (now - (appData.lastUserMsgTime[u.id] || 0) < 60000) return;
        if (Math.random() < 0.005) {
            const pool = getCardPool(u.id, false, true);
            if (pool.length) {
                const textOnlyPool = pool.filter(c => !isEmoji(c));
                const finalPool = textOnlyPool.length > 0 ? textOnlyPool : pool;
                let text = finalPool[Math.floor(Math.random() * finalPool.length)];
                if (Math.random() < 0.7) {
                    if (appData.limitEmojiPerMsg) {
                        const emojiGroupList = (appData.globalCardGroups.find(g => g.name === 'emoji表情')?.list || []);
                        const hasEmoji = emojiGroupList.some(e => text.includes(e));
                        if (!hasEmoji) text += SAFE_EMOJIS[Math.floor(Math.random() * SAFE_EMOJIS.length)];
                    } else {
                        text += SAFE_EMOJIS[Math.floor(Math.random() * SAFE_EMOJIS.length)];
                    }
                }
                text = sanitizeText(text) || '在吗？';
                addMessage(u.id, { text, me: false, time: new Date().toISOString(), senderId: u.id, senderName: u.name, senderAvt: u.avt, initiative: true });
            }
        }
    });
}
// 后台随机更换MJ状态（每30秒5%概率）
setInterval(() => {
  if (pageHiddenTimersPaused) return;
  if (Math.random() > 0.05) return;
  const available = appData.users.filter(u => !u.members);
  if (!available.length) return;
  const u = available[Math.floor(Math.random() * available.length)];
  const now = Date.now();
  const lastChange = appData.lastStatusChangeTime[u.id] || 0;
  if (now - lastChange < 30 * 60 * 1000) return;
  let newStatus;
  do {
    newStatus = STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)];
  } while (newStatus === u.status);
  u.status = newStatus;
  appData.lastStatusChangeTime[u.id] = now;
  markDataChanged();
  save();
}, 30000);
setInterval(scheduleInitiativeMessages, 30000);

// ========== 通话功能 ==========
function getCallDuration() { if (!callState.active || callState.startTimestamp === 0) return 0; return Math.floor((Date.now() - callState.startTimestamp) / 1000); }
function clearCallTimers() { if (callState.timerInterval) { clearInterval(callState.timerInterval); callState.timerInterval = null; } if (callState.callInterval) { clearInterval(callState.callInterval); callState.callInterval = null; } }
function destroyCallUI() { stopCallWaitSound(); if (callState._dragCleanup) { callState._dragCleanup(); callState._dragCleanup = null; } if (callState._pillDragCleanup) { callState._pillDragCleanup(); callState._pillDragCleanup = null; } if (callState.panel) { callState.panel.remove(); callState.panel = null; } if (callState.pill) { callState.pill.remove(); callState.pill = null; } if (callState.floatBall) { callState.floatBall.remove(); callState.floatBall = null; } }

function endCall(record = true) {
    if (!callState.active || callState.ending || callState._hangupLock) return;
    callState._hangupLock = true; callState.ending = true;
    clearCallTimers(); destroyCallUI();
    const dur = getCallDuration(); const chatId = callState.chatId; const phase = callState.phase; const direction = callState.direction;
    const target = getContact(chatId); const targetName = target ? target.name : '好友';
    const now = new Date(); const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    playSound('call_end');
    callState = { active: false, phase: 'idle', direction: 'outgoing', startTimestamp: 0, timerInterval: null, callInterval: null, panel: null, pill: null, chatId: null, ending: false, _hangupLock: false, _dragCleanup: null, _pillDragCleanup: null, expectedEndTime: 0, floatBall: null };
    if (record) {
        if (phase === 'active' && dur > 0 && chatId) addMessage(chatId, { text: `📞 通话 ${fmtCall(dur)}（挂断于 ${timeStr}）`, type: 'system', me: false, time: now.toISOString() });
        else if (direction === 'outgoing' && phase === 'unanswered') addMessage(chatId, { text: `📞 未接来电 ${targetName}（来电 ${timeStr}）`, type: 'system', me: false, time: now.toISOString() });
        else if (direction === 'outgoing' && phase === 'dialing') addMessage(chatId, { text: `📞 通话未接通（${timeStr}）`, type: 'system', me: false, time: now.toISOString() });
        else if (direction === 'incoming' && phase === 'unanswered') addMessage(chatId, { text: `📞 未接来电：${targetName}（${timeStr}）`, type: 'system', me: false, time: now.toISOString() });
        else if (direction === 'incoming' && phase === 'dialing') addMessage(chatId, { text: `📞 您拒绝了 ${targetName} 的来电（${timeStr}）`, type: 'system', me: false, time: now.toISOString() });
    }
    toast(`通话已挂断 ${dur > 0 ? fmtCall(dur) : ''}（${timeStr}）`);
}

function startCall() {
    if (callState.active) { endCall(true); return; }
    const target = getContact(currentChatId); if (!target) { toast("请先选择联系人"); return; }
    clearCallTimers(); destroyCallUI();
    callState.active = true; callState.startTimestamp = Date.now(); callState.chatId = currentChatId; callState.direction = 'outgoing'; callState.phase = 'dialing'; callState.expectedEndTime = Date.now() + 120000;
    callState.panel = document.createElement('div');
    callState.panel.style.cssText = 'position:fixed;bottom:120px;right:16px;width:200px;background:var(--secondary-bg);border-radius:20px;padding:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:1050;touch-action:none';
    const avatarDiv = document.createElement('div'); avatarDiv.style.cssText = 'width:50px;height:50px;margin:0 auto 10px'; avatarDiv.className = 'avatar';
    if (target.avt) { const img = document.createElement('img'); img.src = target.avt; avatarDiv.appendChild(img); } else { avatarDiv.textContent = target.name[0]; }
    callState.panel.appendChild(avatarDiv);
    const nameDiv = document.createElement('div'); nameDiv.textContent = target.name; callState.panel.appendChild(nameDiv);
    const statusDiv = document.createElement('div'); statusDiv.className = 'call-status-text'; statusDiv.textContent = '呼叫中...'; callState.panel.appendChild(statusDiv);
    const timerDiv = document.createElement('div'); timerDiv.className = 'call-timer-text'; timerDiv.textContent = fmtCall(0); callState.panel.appendChild(timerDiv);
    const btnContainer = document.createElement('div'); btnContainer.style.cssText = 'margin-top:10px';
    const minBtn = document.createElement('button'); minBtn.className = 'call-min-btn'; minBtn.style.cssText = 'background:none;border:none;font-size:20px'; minBtn.textContent = '🔽'; minBtn.onclick = minimizeCall;
    const endBtn = document.createElement('button'); endBtn.className = 'call-end-btn'; endBtn.style.cssText = 'margin-left:20px;padding:6px 20px;background:#f44336;color:white;border:none;border-radius:20px;font-size:20px'; endBtn.textContent = '📞'; endBtn.onclick = () => endCall(true);
    btnContainer.appendChild(minBtn); btnContainer.appendChild(endBtn);
    callState.panel.appendChild(btnContainer);
    document.body.appendChild(callState.panel); startCallWaitSound();
    callState.timerInterval = setInterval(() => { updateCallTimerDisplay(); if (Date.now() >= callState.expectedEndTime) { endCall(true); } }, 1000);
    const ringDelay = 2000 + Math.floor(Math.random() * 4000);
    callState.callInterval = setTimeout(() => {
        if (!callState.active || callState.phase !== 'dialing') return;
        const random = Math.random();
        if (random < 0.96) {
            stopCallWaitSound(); playSound('call_connect');
            callState.startTimestamp = Date.now(); callState.phase = 'active'; callState.expectedEndTime = Date.now() + 86400000;
            updateCallTimerDisplay();
            if (callState.timerInterval) clearInterval(callState.timerInterval);
            callState.timerInterval = setInterval(() => { updateCallTimerDisplay(); if (Date.now() >= callState.expectedEndTime) { endCall(true); } }, 1000);
            btnContainer.innerHTML = '';
            const minBtn2 = document.createElement('button'); minBtn2.className = 'call-min-btn'; minBtn2.style.cssText = 'background:none;border:none;font-size:20px'; minBtn2.textContent = '🔽'; minBtn2.onclick = minimizeCall;
            const endBtn2 = document.createElement('button'); endBtn2.className = 'call-end-btn'; endBtn2.style.cssText = 'margin-left:20px;padding:6px 20px;background:#f44336;color:white;border:none;border-radius:20px;font-size:20px'; endBtn2.textContent = '📞'; endBtn2.onclick = () => endCall(true);
            btnContainer.appendChild(minBtn2); btnContainer.appendChild(endBtn2);
        } else if (random < 0.98) {
            addMessage(callState.chatId, { text: `📞 ${target.name} 拒绝了您的通话`, type: 'system', me: false, time: new Date().toISOString() }); endCall(false);
        } else { callState.phase = 'unanswered'; callState.expectedEndTime = Date.now() + 120000; updateCallTimerDisplay(); }
    }, ringDelay);
    callState.panel.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return; e.preventDefault();
        callState.dragOff = { x: e.clientX - callState.panel.offsetLeft, y: e.clientY - callState.panel.offsetTop };
        callState.panel.setPointerCapture(e.pointerId);
        const move = ev => { if (!callState.panel) return; callState.panel.style.left = (ev.clientX - callState.dragOff.x) + 'px'; callState.panel.style.top = (ev.clientY - callState.dragOff.y) + 'px'; callState.panel.style.right = 'auto'; callState.panel.style.bottom = 'auto'; };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (callState.panel) callState.panel.releasePointerCapture(e.pointerId); };
        callState._dragCleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
}

function startIncomingCall(userId) {
    if (callState.active) return; const target = getContact(userId); if (!target) return;
    clearCallTimers(); destroyCallUI();
    callState.active = true; callState.startTimestamp = Date.now(); callState.chatId = userId; callState.direction = 'incoming'; callState.phase = 'dialing'; callState.expectedEndTime = Date.now() + 120000;
    callState.panel = document.createElement('div');
    callState.panel.style.cssText = 'position:fixed;bottom:120px;right:16px;width:200px;background:var(--secondary-bg);border-radius:20px;padding:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:1050;touch-action:none';
    callState.panel.innerHTML = `<div class="avatar" style="width:50px;height:50px;margin:0 auto 10px">${target.avt ? `<img src="${target.avt}">` : target.name[0]}</div><div>${escapeHtml(target.name)}</div><div class="call-status-text">来电...</div><div class="call-timer-text">${fmtCall(0)}</div><div style="margin-top:10px;display:flex;justify-content:center;gap:8px"><button class="call-min-btn" style="background:none;border:none;font-size:18px">🔽</button><button class="call-accept-btn" style="padding:6px 20px;background:#4CAF50;color:white;border:none;border-radius:20px;font-size:16px">接听</button><button class="call-reject-btn" style="padding:6px 20px;background:#f44336;color:white;border:none;border-radius:20px;font-size:16px">拒绝</button></div>`;
    document.body.appendChild(callState.panel); startCallRingSound();
    callState.timerInterval = setInterval(() => { updateCallTimerDisplay(); if (Date.now() >= callState.expectedEndTime) { endCall(true); } }, 1000);
    callState.panel.querySelector('.call-min-btn').onclick = minimizeCall;
    callState.panel.querySelector('.call-accept-btn').onclick = () => {
        stopCallWaitSound(); playSound('call_connect');
        callState.startTimestamp = Date.now(); callState.phase = 'active'; callState.expectedEndTime = Date.now() + 86400000;
        updateCallTimerDisplay();
        if (callState.timerInterval) clearInterval(callState.timerInterval);
        callState.timerInterval = setInterval(() => { updateCallTimerDisplay(); if (Date.now() >= callState.expectedEndTime) { endCall(true); } }, 1000);
        callState.panel.querySelector('div:last-child').innerHTML = '<button class="call-end-btn" style="padding:6px 20px;background:#f44336;color:white;border:none;border-radius:20px;font-size:16px">📞 挂断</button><button class="call-min-btn" style="background:none;border:none;font-size:18px">🔽</button>';
        callState.panel.querySelector('.call-end-btn').onclick = () => endCall(true);
        callState.panel.querySelector('.call-min-btn').onclick = minimizeCall;
    };
    callState.panel.querySelector('.call-reject-btn').onclick = () => {
        addMessage(userId, { text: `📞 您拒绝了 ${target.name} 的来电（${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}）`, type: 'system', me: false, time: new Date().toISOString() });
        endCall(false);
    };
    callState.panel.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return; e.preventDefault();
        callState.dragOff = { x: e.clientX - callState.panel.offsetLeft, y: e.clientY - callState.panel.offsetTop };
        callState.panel.setPointerCapture(e.pointerId);
        const move = ev => { if (!callState.panel) return; callState.panel.style.left = (ev.clientX - callState.dragOff.x) + 'px'; callState.panel.style.top = (ev.clientY - callState.dragOff.y) + 'px'; callState.panel.style.right = 'auto'; callState.panel.style.bottom = 'auto'; };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (callState.panel) callState.panel.releasePointerCapture(e.pointerId); };
        callState._dragCleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    });
}

setInterval(() => {
    if (callState.active) return;
    const chance = 0.01 + Math.random() * 0.02;
    if (Math.random() > chance) return;
    const today = new Date().toDateString();
    if (!appData.dailyCallCount || appData.dailyCallCountDate !== today) {
        appData.dailyCallCount = 0;
        appData.dailyCallCountDate = today;
    }
    if (appData.dailyCallCount >= 3) return;
    const available = appData.users.filter(u => !u.noDisturb && !u.noReply && !u.muted);
    if (available.length) {
        appData.dailyCallCount++;
        markDataChanged(); save();
        startIncomingCall(available[Math.floor(Math.random() * available.length)].id);
    }
}, 30000);

function minimizeCall() {
    if (!callState.panel) return;
    callState.panel.style.display = 'none';
    if (!callState.pill) {
        callState.pill = document.createElement('div'); callState.pill.className = 'call-mini';
        callState.pill.style.cssText = 'position:fixed;bottom:80px;right:16px;background:var(--theme);color:#fff;padding:8px 16px;border-radius:20px;cursor:pointer;z-index:1100;display:flex;align-items:center;gap:8px;user-select:none;touch-action:none';
        callState.pill.innerHTML = `<span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span><span class="pill-status">${callState.phase === 'active' ? '通话中' : (callState.phase === 'unanswered' ? '等待中' : (callState.direction === 'incoming' ? '来电' : '呼叫中'))}</span><span class="pill-time">${fmtCall(getCallDuration())}</span><button class="call-mini-end"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>`;
        document.body.appendChild(callState.pill);
        callState.pill.querySelector('.call-mini-end').onclick = e => { e.stopPropagation(); endCall(true); };
        callState.pill.addEventListener('pointerdown', e => {
            if (e.target.classList.contains('call-mini-end')) return; e.preventDefault();
            callState.pillDragOff = { x: e.clientX - callState.pill.offsetLeft, y: e.clientY - callState.pill.offsetTop };
            callState.pill.setPointerCapture(e.pointerId);
            const move = ev => { if (!callState.pill) return; callState.pill.style.left = (ev.clientX - callState.pillDragOff.x) + 'px'; callState.pill.style.top = (ev.clientY - callState.pillDragOff.y) + 'px'; callState.pill.style.right = 'auto'; callState.pill.style.bottom = 'auto'; };
            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (callState.pill) callState.pill.releasePointerCapture(e.pointerId); };
            callState._pillDragCleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
            window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
        });
        callState.pill.addEventListener('click', restoreCall);
    }
    callState.pill.querySelector('.pill-status').textContent = callState.phase === 'active' ? '通话中' : (callState.phase === 'unanswered' ? '等待中' : (callState.direction === 'incoming' ? '来电' : '呼叫中'));
    callState.pill.style.display = 'flex';
    updateCallTimerDisplay();
}

function restoreCall() { if (callState.pill) callState.pill.style.display = 'none'; if (callState.panel) callState.panel.style.display = 'block'; }
function updateCallTimerDisplay() { const dur = getCallDuration(); const statusText = callState.phase === 'active' ? '通话中' : (callState.phase === 'unanswered' ? '等待中...' : (callState.direction === 'incoming' ? '来电...' : '呼叫中...')); const time = fmtCall(dur); if (callState.panel) { callState.panel.querySelector('.call-status-text').textContent = statusText; callState.panel.querySelector('.call-timer-text').textContent = time; } if (callState.pill) { callState.pill.querySelector('.pill-status').textContent = statusText; callState.pill.querySelector('.pill-time').textContent = time; } }
function fmtCall(s) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`; }
function updateCallFloatBall() { if (!callState.active) { if (callState.floatBall) { callState.floatBall.style.display = 'none'; } return; } if (!callState.floatBall) { callState.floatBall = document.createElement('div'); callState.floatBall.className = 'call-float-ball'; callState.floatBall.style.bottom = '130px'; callState.floatBall.style.right = '16px'; document.body.appendChild(callState.floatBall); let dragOff = null; callState.floatBall.addEventListener('pointerdown', (e) => { e.preventDefault(); dragOff = { x: e.clientX - callState.floatBall.offsetLeft, y: e.clientY - callState.floatBall.offsetTop }; callState.floatBall.setPointerCapture(e.pointerId); const move = (ev) => { callState.floatBall.style.left = (ev.clientX - dragOff.x) + 'px'; callState.floatBall.style.top = (ev.clientY - dragOff.y) + 'px'; callState.floatBall.style.right = 'auto'; callState.floatBall.style.bottom = 'auto'; }; const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); const rect = callState.floatBall.getBoundingClientRect(); const minVisible = 20; if (rect.left < -(55 - minVisible)) callState.floatBall.style.left = -(55 - minVisible) + 'px'; if (rect.right > window.innerWidth + (55 - minVisible)) callState.floatBall.style.left = (window.innerWidth - minVisible) + 'px'; if (rect.top < -(55 - minVisible)) callState.floatBall.style.top = -(55 - minVisible) + 'px'; if (rect.bottom > window.innerHeight + (55 - minVisible)) callState.floatBall.style.top = (window.innerHeight - minVisible) + 'px'; }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); }); callState.floatBall.addEventListener('click', () => { if (callState.panel && callState.panel.style.display !== 'none') { minimizeCall(); } else if (callState.pill && callState.pill.style.display !== 'none') { callState.pill.style.display = 'none'; if (callState.panel) callState.panel.style.display = 'none'; } else { if (callState.panel) callState.panel.style.display = 'block'; if (callState.pill) callState.pill.style.display = 'none'; } }); } callState.floatBall.style.display = 'flex'; callState.floatBall.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'; }
setInterval(() => { updateCallFloatBall(); }, 1000);

// ========== 拍一拍 ==========
function openPokePage(targetId, fromPage) {
    _pokeTargetId = targetId;
    if (document.getElementById('chatPage').classList.contains('active')) { _pokeFromPage = 'chat'; } else { _pokeFromPage = fromPage || 'chats'; }
    document.getElementById('chatsPage').classList.remove('active'); document.getElementById('chatPage').classList.remove('active'); document.getElementById('contactsPage').classList.remove('active'); document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('discoverPage').classList.remove('active'); document.getElementById('momentsPage').classList.remove('active'); document.getElementById('mePage').classList.remove('active');
    document.getElementById('pokePage').classList.add('active');
    renderPokePage();
}

function renderPokePage() {
    const target = getContact(_pokeTargetId); if (!target) return;
    const pokeGroup = appData.globalCardGroups.find(g => g.name === '拍一拍');
    const phrases = pokeGroup ? pokeGroup.list.filter(p => !appData.disabledGlobalCards.includes(p)) : POKE_PHRASES;
    const container = document.getElementById('pokePageContent'); while (container.firstChild) container.removeChild(container.firstChild);
    const addBtn = document.createElement('button'); addBtn.className = 'btn btn-primary'; addBtn.textContent = '+ 自定义拍一拍'; addBtn.style.marginBottom = '10px';
    addBtn.onclick = () => {
        showInputDialogRaw('自定义拍一拍', '直接写自然语言，例如：我拍了拍他的肩膀，说我爱你', (val) => {
            if (val) {
                let phrase = convertToTemplate(val.trim());
                if (!phrase.includes('{from}')) phrase = '{from}' + phrase;
                if (!phrase.includes('{to}')) phrase = phrase + '{to}';
                const grp = appData.globalCardGroups.find(g => g.name === '拍一拍');
                if (grp) grp.list.unshift(phrase);
                else appData.globalCardGroups.push({ name: '拍一拍', list: [phrase] });
                markDataChanged(); save(); toast('拍一拍已保存'); renderPokePage();
            }
        });
    };
    container.appendChild(addBtn);
    const fragment = document.createDocumentFragment();
    phrases.forEach((p, i) => {
        const preview = p.replace(/\{from\}/g, appData.myProfile.name).replace(/\{to\}/g, target.name);
        const item = document.createElement('div'); item.className = 'context-menu-item'; item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 8px;border-bottom:1px solid var(--border-light);';
        item.innerHTML = `<span data-phrase="${escapeHtml(p)}" style="flex:1;font-size:14px">${escapeHtml(preview)}</span><span style="display:flex;gap:12px;align-items:center;"><span style="cursor:pointer;color:var(--theme);display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('edit-3')}</svg></span><span style="cursor:pointer;color:#f44336;display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('x')}</svg></span></span>`;
        item.querySelector('[data-phrase]').onclick = () => {
            window.pokeUser(_pokeTargetId, 'me', p);
            document.getElementById('pokePage').classList.remove('active');
            if (_pokeFromPage === 'chat') { document.getElementById('chatPage').classList.add('active'); } else { document.getElementById('chatsPage').classList.add('active'); }
        };
        item.querySelector('span[style*="color:var(--theme)"]').onclick = (e) => { e.stopPropagation(); editPokePhraseInline(i); };
        item.querySelector('span[style*="color:#f44336"]').onclick = (e) => { e.stopPropagation(); deletePokePhraseInline(i); };
        fragment.appendChild(item);
    });
    container.appendChild(fragment);
    if (phrases.length === 0) {
        const empty = document.createElement('div'); empty.textContent = '暂无拍一拍短语'; empty.style.cssText = 'text-align:center;color:var(--text-secondary);padding:20px'; container.appendChild(empty);
    }
}

function convertToTemplate(text) {
    if (!text) return '';
    let result = text.replace(/我/g, '{from}');
    result = result.replace(/你/g, '{to}');
    result = result.replace(/他/g, '{to}');
    result = result.replace(/她/g, '{to}');
    result = result.replace(/它/g, '{to}');
    return result;
}

function convertToDisplay(template) { return template.replace(/\{from\}/g, '我').replace(/\{to\}/g, '他'); }

window.pokeUser = function(targetId, fromId = 'me', customPhrase = null) {
    const target = getContact(targetId); const from = getContact(fromId);
    if (!target || !from) return;
    const toContact = fromId === 'me' ? target : appData.myProfile;
    const phrase = customPhrase || (appData.globalCardGroups.find(g => g.name === '拍一拍')?.list[Math.floor(Math.random() * appData.globalCardGroups.find(g => g.name === '拍一拍')?.list.length || POKE_PHRASES.length)] || POKE_PHRASES[0]);
    const safePhrase = (phrase.includes('{from}') && phrase.includes('{to}')) ? phrase : POKE_PHRASES[0];
    const text = safePhrase.replace(/\{from\}/g, from.name).replace(/\{to\}/g, toContact.name);
    addMessage(targetId, { text, type: 'system', me: false, time: new Date().toISOString(), pokeData: { fromId, toId: toContact.id, fromName: from.name, toName: toContact.name, phrase: safePhrase } });
};

function editPokePhraseInline(index) {
    const grp = appData.globalCardGroups.find(g => g.name === '拍一拍');
    if (!grp || !grp.list[index]) return;
    const displayText = convertToDisplay(grp.list[index]);
    showInputDialogPrefilled('编辑拍一拍（直接写自然语言）', displayText, (val) => {
        if (val) {
            let phrase = convertToTemplate(val.trim());
            if (!phrase.includes('{from}')) phrase = '{from}' + phrase;
            if (!phrase.includes('{to}')) phrase = phrase + '{to}';
            grp.list[index] = phrase;
            markDataChanged(); save(); toast('词条已更新'); renderPokePage();
        }
    });
}

function deletePokePhraseInline(index) {
    const grp = appData.globalCardGroups.find(g => g.name === '拍一拍');
    if (!grp) return;
    showConfirm('删除这个词条？', () => {
        grp.list.splice(index, 1);
        markDataChanged(); save(); renderPokePage(); toast('已删除');
    });
}

// ========== 群聊设置 ==========
function openGroupSettings(group) {
    document.querySelectorAll('.mask.show').forEach(m => m.remove());
    const mask = document.getElementById("globalMask");
    while (mask.firstChild) mask.removeChild(mask.firstChild); mask.className = 'mask show';
    const card = document.createElement('div'); card.className = 'pop-card';
    const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '群聊·' + escapeHtml(group.name);
    const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => mask.classList.remove('show');
    header.appendChild(closeBtn); card.appendChild(header);
    const body = document.createElement('div'); body.className = 'pop-body'; body.style.overflowY = 'auto';

    const announcementDiv = document.createElement('div'); announcementDiv.style.cssText = 'margin-bottom:8px;';
    announcementDiv.innerHTML = `<textarea id="gannouncement" placeholder="群公告" style="width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px;">${escapeHtml(group.announcement || '')}</textarea><button class="btn" id="saveAnnouncement">保存公告</button>`;
    body.appendChild(announcementDiv);

    const nameRow = document.createElement('div');
    const gnameInput = document.createElement('input'); gnameInput.id = 'gname'; gnameInput.value = group.name; gnameInput.style.cssText = 'border-radius:14px;border:1px solid var(--border-light);padding:6px;width:100%';
    const gnameBtn = document.createElement('button'); gnameBtn.className = 'btn'; gnameBtn.style.marginTop = '4px'; gnameBtn.textContent = '改名';
    gnameBtn.onclick = () => { group.name = gnameInput.value.trim(); markDataChanged(); save(); document.getElementById('chatTitle').innerText = group.name; renderChatList(); renderContactList(); };
    nameRow.appendChild(gnameInput); nameRow.appendChild(gnameBtn); body.appendChild(nameRow);

    const noReplyToggle = document.createElement('div'); noReplyToggle.className = 'toggle-switch';
    const noReplySpan = document.createElement('span'); noReplySpan.textContent = '已读不回';
    const noReplyCheck = document.createElement('input'); noReplyCheck.type = 'checkbox'; noReplyCheck.id = 'gnoreply'; noReplyCheck.checked = group.noReply;
    noReplyCheck.onchange = e => { group.noReply = e.target.checked; markDataChanged(); save(); };
    noReplyToggle.appendChild(noReplySpan); noReplyToggle.appendChild(noReplyCheck); body.appendChild(noReplyToggle);

    const noDisturbToggle = document.createElement('div'); noDisturbToggle.className = 'toggle-switch';
    const noDisturbSpan = document.createElement('span'); noDisturbSpan.textContent = '免打扰';
    const noDisturbCheck = document.createElement('input'); noDisturbCheck.type = 'checkbox'; noDisturbCheck.id = 'gnodisturb'; noDisturbCheck.checked = group.noDisturb;
    noDisturbCheck.onchange = e => { group.noDisturb = e.target.checked; markDataChanged(); save(); };
    noDisturbToggle.appendChild(noDisturbSpan); noDisturbToggle.appendChild(noDisturbCheck); body.appendChild(noDisturbToggle);

    const mutedAllToggle = document.createElement('div'); mutedAllToggle.className = 'toggle-switch';
    const mutedAllSpan = document.createElement('span'); mutedAllSpan.style.cssText = 'display:flex;align-items:center;gap:4px;color:#f44336;';
    mutedAllSpan.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('volume-x')}</svg>全部禁言`;
    const mutedAllCheck = document.createElement('input'); mutedAllCheck.type = 'checkbox'; mutedAllCheck.id = 'gmutedAll'; mutedAllCheck.checked = !!group.mutedAll;
    mutedAllCheck.onchange = e => { group.mutedAll = e.target.checked; markDataChanged(); save(); };
    mutedAllToggle.appendChild(mutedAllSpan); mutedAllToggle.appendChild(mutedAllCheck); body.appendChild(mutedAllToggle);

    const memberHeader = document.createElement('div'); memberHeader.style.cssText = 'display:flex;justify-content:space-between';
    const memberTitle = document.createElement('strong'); memberTitle.textContent = '成员';
    const addMemBtn = document.createElement('button'); addMemBtn.className = 'btn btn-primary'; addMemBtn.textContent = '+添加'; addMemBtn.onclick = () => addGroupMember(group.id);
    memberHeader.appendChild(memberTitle); memberHeader.appendChild(addMemBtn); body.appendChild(memberHeader);
    const gmemlist = document.createElement('div'); gmemlist.id = 'gmemlist'; body.appendChild(gmemlist);

    const exitBtn = document.createElement('button'); exitBtn.className = 'btn'; exitBtn.style.cssText = 'color:#f44336'; exitBtn.textContent = '退出群聊';
    exitBtn.onclick = () => showConfirm('退出群聊？', () => {
        group.members = group.members.filter(m => m !== 'me');
        markDataChanged(); save(); renderChatList(); renderContactList(); updateGroupMemberList();
    });
    body.appendChild(exitBtn);

    const delBtn = document.createElement('button'); delBtn.className = 'btn'; delBtn.style.cssText = 'color:#f44336'; delBtn.textContent = '删除群聊';
    delBtn.onclick = () => showConfirm('删除群聊？', () => {
        appData.groups = appData.groups.filter(g => g.id !== group.id);
        delete appData.msg[group.id];
        markDataChanged(); save(); renderChatList(); renderContactList();
        if (currentChatId === group.id) {
            document.getElementById('chatsPage').classList.add('active');
            document.getElementById('chatPage').classList.remove('active');
        }
        mask.classList.remove('show');
    });
    body.appendChild(delBtn);

    card.appendChild(body); mask.appendChild(card);
    mask.addEventListener('click', e => { if (e.target === mask) mask.classList.remove('show'); });
    setTimeout(() => {
        document.getElementById('saveAnnouncement').onclick = () => {
            group.announcement = document.getElementById('gannouncement').value.trim();
            markDataChanged(); save(); toast('公告已保存');
        };
    }, 50);
    updateGroupMemberList();
}

function updateGroupMemberList() {
    const g = appData.groups.find(x => x.id === currentChatId);
    if (!g) return;
    const c = document.getElementById('gmemlist'); if (!c) return; while (c.firstChild) c.removeChild(c.firstChild);
    g.members.forEach(mid => {
        const m = mid === 'me' ? appData.myProfile : appData.users.find(u => u.id === mid);
        if (!m) return;
        const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;padding:4px 0;border-bottom:1px solid var(--border-light)';
        const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.style.cssText = 'width:32px;height:32px;font-size:14px;margin-right:8px';
        if (m.avt) { const img = document.createElement('img'); img.src = m.avt; avatar.appendChild(img); } else { avatar.textContent = m.name[0]; }
        const nameDiv = document.createElement('div'); nameDiv.style.flex = '1'; nameDiv.textContent = m.name + (mid === 'me' ? ' (我)' : '');
        row.appendChild(avatar); row.appendChild(nameDiv);
        if (mid !== 'me') {
            const muteBtn = document.createElement('button'); muteBtn.className = 'btn';
            muteBtn.style.cssText = 'font-size:10px;padding:2px 6px;margin-left:4px;display:inline-flex;align-items:center;gap:3px;color:#f44336;';
            if (g.mutedMembers[mid]) {
                muteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('volume-2')}</svg> 解禁`;
            } else {
                muteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('volume-x')}</svg> 禁言`;
            }
            muteBtn.onclick = () => { g.mutedMembers[mid] = !g.mutedMembers[mid]; markDataChanged(); save(); updateGroupMemberList(); toast(g.mutedMembers[mid] ? '已禁言' : '已解禁'); };
            row.appendChild(muteBtn);
            const delBtn = document.createElement('span'); delBtn.style.cssText = 'cursor:pointer;font-size:16px;margin-left:8px;display:inline-flex;align-items:center;';
            delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('trash-2')}</svg>`;
            delBtn.onclick = () => showConfirm('移除该成员？', () => { g.members = g.members.filter(x => x !== mid); markDataChanged(); save(); updateGroupMemberList(); renderChatList(); });
            row.appendChild(delBtn);
        }
        c.appendChild(row);
    });
}

function addGroupMember(gid) {
    const g = appData.groups.find(x => x.id === gid); if (!g) return;
    const av = appData.users.filter(u => !g.members.includes(u.id));
    if (!av.length) { toast("暂无好友可添加"); return; }
    const overlay = document.createElement('div'); overlay.className = 'mask show';
    const card = document.createElement('div'); card.className = 'pop-card';
    const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '选择成员';
    const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn); card.appendChild(header);
    const body = document.createElement('div'); body.className = 'pop-body';
    av.forEach(u => {
        const label = document.createElement('label');
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = u.id; cb.className = 'mcb';
        label.appendChild(cb);
        if (u.avt) { const img = document.createElement('img'); img.src = u.avt; img.style.width = '24px'; label.appendChild(img); }
        label.appendChild(document.createTextNode(' ' + u.name));
        body.appendChild(label); body.appendChild(document.createElement('br'));
    });
    card.appendChild(body);
    const footer = document.createElement('div'); footer.className = 'pop-footer';
    const selAllBtn = document.createElement('button'); selAllBtn.className = 'btn'; selAllBtn.textContent = '全选'; selAllBtn.onclick = () => overlay.querySelectorAll('.mcb').forEach(c => c.checked = true);
    const confirmBtn = document.createElement('button'); confirmBtn.className = 'btn-primary'; confirmBtn.textContent = '确认';
    confirmBtn.onclick = () => {
        const s = Array.from(overlay.querySelectorAll('.mcb:checked')).map(c => c.value);
        if (s.length) {
            const existing = new Set(g.members);
            const newM = s.filter(id => !existing.has(id));
            if (newM.length === 0) { toast('所选成员已在群内'); return; }
            g.members.push(...newM);
            markDataChanged(); save(); updateGroupMemberList(); renderChatList();
        }
        overlay.remove();
    };
    footer.appendChild(selAllBtn); footer.appendChild(confirmBtn); card.appendChild(footer);
    overlay.appendChild(card); document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}