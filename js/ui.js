// ========== ui.js — 界面渲染 ==========

// ========== 聊天列表 ==========
function getUnreadCount(chatId) {
    const msgs = appData.msg[chatId] || [];
    let count = 0;
    for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].senderId === 'me' || msgs[i].me) break;
        count++;
    }
    return count;
}

function renderChatList() {
    const c = document.getElementById('chatListContainer');
    const allChats = [{ id: 'me', name: appData.myProfile.name, avt: appData.myProfile.avt, bg: appData.myProfile.bg, members: null }, ...appData.users, ...appData.groups];
    const items = allChats.filter(it => !appData.hiddenChats.includes(it.id)).map(it => {
        let previewText = '';
        const unreadReplies = (appData.letters[it.id] || []).filter(l => l.from !== 'me' && !l.read);
        const lastMsg = (appData.msg[it.id] || []).slice(-1)[0];
        const u = getContact(it.id);
        const isHidden = u && u.hideReplyIndicator;
        if (unreadReplies.length > 0 && !isHidden) {
            const latestUnreadReply = unreadReplies.slice(-1)[0];
            const replyTime = new Date(latestUnreadReply.time).getTime();
            const lastMsgTime = lastMsg ? new Date(lastMsg.time).getTime() : 0;
            if (lastMsg && replyTime >= lastMsgTime) {
                previewText = '📬 有新的回信';
            } else if (lastMsg) {
                let pt = '';
                if (lastMsg.type === 'system' && lastMsg.pokeData) { const from = getContact(lastMsg.pokeData.fromId), to = getContact(lastMsg.pokeData.toId); pt = lastMsg.pokeData.phrase.replace(/\{from\}/g, from ? from.name : lastMsg.pokeData.fromName).replace(/\{to\}/g, to ? to.name : lastMsg.pokeData.toName); } else if (lastMsg.voice && !lastMsg.text) pt = '[语音]'; else if (lastMsg.image && !lastMsg.text) pt = '[图片]'; else if (lastMsg.text) pt = lastMsg.text; else pt = '暂无消息';
                previewText = pt;
            } else {
                previewText = '📬 有新的回信';
            }
        } else {
            let pt = '';
            if (lastMsg) { if (lastMsg.type === 'system' && lastMsg.pokeData) { const from = getContact(lastMsg.pokeData.fromId), to = getContact(lastMsg.pokeData.toId); pt = lastMsg.pokeData.phrase.replace(/\{from\}/g, from ? from.name : lastMsg.pokeData.fromName).replace(/\{to\}/g, to ? to.name : lastMsg.pokeData.toName); } else if (lastMsg.voice && !lastMsg.text) pt = '[语音]'; else if (lastMsg.image && !lastMsg.text) pt = '[图片]'; else if (lastMsg.text) pt = lastMsg.text; else pt = '暂无消息'; } else pt = '暂无消息';
            previewText = pt;
        }
        const hasUnread = unreadReplies.length > 0 && !isHidden;
        const replyBadge = hasUnread ? '<span class="reply-badge show">📬</span>' : '<span class="reply-badge"></span>';
        let unreadBadgeHtml = '';
        if (it.id !== 'me' && !it.members) {
            if (appData.globalUnreadBadgeEnabled !== false) {
                const showBadge = appData.unreadBadgeSettings[it.id] !== false;
                if (showBadge) {
                    const unreadCount = getUnreadCount(it.id);
                    if (unreadCount > 0) {
                        unreadBadgeHtml = `<span class="unread-badge" data-unread="${it.id}">${unreadCount > 99 ? '99+' : unreadCount}</span>`;
                    }
                }
            }
        }
        const isImageMode = window._navBgImageMode && window._navBgImageMode['chats'];
        return `<div class="chat-item" data-id="${it.id}" style="position:relative;${isImageMode ? 'border-bottom-color:transparent;background:rgba(255,255,255,0.15);' : ''}">
            <div class="avatar" data-userid="${it.id}">
                ${it.avt ? `<img src="${it.avt}" onerror="this.style.display='none';this.nextElementSibling.style.display='';"><span style="display:none;">${it.name[0]}</span>` : (it.members ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="17" cy="7" r="3"/><path d="M23 21v-2a3 3 0 0 0-3-3h-1"/></svg>' : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>')}
            </div>
            <div class="info">
                <div class="name" style="${isImageMode ? 'text-shadow:none !important;background:transparent !important;' : ''}">${escapeHtml(it.name)}${it.members ? ` (${it.members.length})` : ''}</div>
                <div class="preview" style="${isImageMode ? 'text-shadow:none !important;background:transparent !important;' : ''}">${escapeHtml(previewText)}</div>
            </div>
            ${replyBadge}
            ${unreadBadgeHtml}
            <div class="swipe-bg">隐藏</div>
        </div>`;
    }).join('') || '<div style="padding:30px;text-align:center">暂无聊天</div>';
    c.innerHTML = items;
    c.querySelectorAll('.chat-item').forEach(el => {
        const avatarEl = el.querySelector('.avatar');
        let clickTimer = null;
        el.addEventListener('click', (e) => {
            if (el.classList.contains('swiped')) return;
            if (e.target.closest('.swipe-bg')) return;
            if (avatarEl && avatarEl.contains(e.target)) {
                if (clickTimer) clearTimeout(clickTimer);
                clickTimer = setTimeout(() => { currentChatId = el.dataset.id; openChat(); }, 300);
            } else { currentChatId = el.dataset.id; openChat(); }
        });
        if (avatarEl) {
            avatarEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                if (clickTimer) clearTimeout(clickTimer);
                const uid = avatarEl.dataset.userid;
                const contact = getContact(uid);
                if (contact && contact.members) { toast('群聊没有朋友圈哦'); return; }
                if (uid) openMomentsPage(uid, true);
            });
        }
        const swipeBg = el.querySelector('.swipe-bg');
        if (swipeBg) swipeBg.onclick = (e) => { e.stopPropagation(); hideChat(el.dataset.id); };
        el.addEventListener('touchstart', (e) => { swipeStartX = e.touches[0].clientX; swipeStartY = e.touches[0].clientY; swipeItem = el; }, { passive: true });
        el.addEventListener('touchmove', (e) => {
            if (!swipeItem) return;
            const dx = e.touches[0].clientX - swipeStartX;
            const dy = e.touches[0].clientY - swipeStartY;
            if (Math.abs(dx) > Math.abs(dy) && dx < -30) { swipeItem.classList.add('swiped'); } else if (dx > 30) { swipeItem.classList.remove('swiped'); }
        }, { passive: true });
        el.addEventListener('touchend', () => { swipeItem = null; });
    });
}

document.getElementById('chatListContainer').addEventListener('touchstart', (e) => {
    const avatar = e.target.closest('.avatar');
    if (!avatar) return;
    const uid = avatar.dataset.userid;
    if (!uid) return;
    longPressTimer = setTimeout(() => {
        const u = getContact(uid);
        if (!u) return;
        showInputDialog('修改昵称', u.name, (val) => {
            if (val && val !== u.name) {
                u.name = val; markDataChanged(); save(); updateAllNicknames(u); toast('昵称已更新');
            } else if (val === u.name) toast('昵称未变更');
        });
    }, 500);
}, { passive: true });
document.getElementById('chatListContainer').addEventListener('touchend', () => { clearTimeout(longPressTimer); });
document.getElementById('chatListContainer').addEventListener('touchmove', () => { clearTimeout(longPressTimer); });

window.hideChat = function(chatId) {
    showConfirm('隐藏此聊天？消息仍会正常接收', () => {
        if (!appData.hiddenChats.includes(chatId)) appData.hiddenChats.push(chatId);
        markDataChanged(); save(); renderChatList(); toast('聊天已隐藏');
    });
};
window.unhideChat = function(chatId) {
    appData.hiddenChats = appData.hiddenChats.filter(id => id !== chatId);
    markDataChanged(); save(); renderChatList(); renderContactList(); toast('聊天已恢复');
};

function updateAllNicknames(u) {
    if (currentChatId === u.id && u.id !== 'me') { updateChatTitleReplyIndicator(u.id); }
    if (document.getElementById('momentsPage').classList.contains('active') && currentMomentUserId === u.id) { document.getElementById('momentsTitle').innerText = u.name + '的朋友圈'; renderMomentsList(); }
    if (document.getElementById('letterPage').classList.contains('active') && currentChatId === u.id) { document.getElementById('letterPageTitle').innerText = `与 ${u.name} 的信件`; }
    Object.values(appData.msg).forEach(msgs => {
        msgs.forEach(m => {
            if (m.type === 'system' && m.pokeData) { const from = getContact(m.pokeData.fromId); const to = getContact(m.pokeData.toId); m.text = m.pokeData.phrase.replace(/\{from\}/g, from ? from.name : m.pokeData.fromName).replace(/\{to\}/g, to ? to.name : m.pokeData.toName); } else if (!m.me && m.senderId === u.id) { m.senderName = u.name; }
        });
    });
    renderMessages();
    const listItem = document.querySelector(`.chat-item[data-id="${u.id}"]`);
    if (listItem) {
        const nameEl = listItem.querySelector('.name');
        if (nameEl) nameEl.innerHTML = u.name + (u.members ? ` (${u.members.length})` : '');
        const avatarEl = listItem.querySelector('.avatar');
        if (avatarEl) {
            const imgEl = avatarEl.querySelector('img');
            if (u.avt) {
                if (imgEl) imgEl.src = u.avt;
                else { while (avatarEl.firstChild) avatarEl.removeChild(avatarEl.firstChild); const img = document.createElement('img'); img.src = u.avt; avatarEl.appendChild(img); }
            } else { if (imgEl) imgEl.remove(); if (!avatarEl.querySelector('img')) { avatarEl.textContent = u.members ? '👥' : u.name[0]; } }
        }
    }
    if (document.getElementById('contactDetailPage').classList.contains('active')) {
        const detailTitle = document.getElementById('contactDetailTitle');
        if (detailTitle && detailTitle.textContent === u.name) {
            const detailAvatar = document.querySelector('#contactDetailContent .avatar');
            if (detailAvatar) {
                if (u.avt) {
                    while (detailAvatar.firstChild) detailAvatar.removeChild(detailAvatar.firstChild);
                    const img = document.createElement('img'); img.src = u.avt; detailAvatar.appendChild(img);
                } else {
                    const imgEl = detailAvatar.querySelector('img');
                    if (imgEl) imgEl.remove();
                    if (!detailAvatar.querySelector('img')) detailAvatar.textContent = u.name[0];
                }
            }
        }
    }
    if (u.id === 'me') {
        syncMyNicknameGlobally();
        const myAvatar = document.getElementById('myProfileAvatar');
        if (myAvatar) {
            if (appData.myProfile.avt) {
                while (myAvatar.firstChild) myAvatar.removeChild(myAvatar.firstChild);
                const img = document.createElement('img'); img.src = appData.myProfile.avt; myAvatar.appendChild(img);
            } else {
                const imgEl = myAvatar.querySelector('img');
                if (imgEl) imgEl.remove();
                if (!myAvatar.querySelector('img')) myAvatar.textContent = appData.myProfile.name[0];
            }
        }
    }
    renderChatList();
}

// ========== 通讯录 ==========
function renderContactList() {
    const container = document.getElementById('contactListContainer');
    while (container.firstChild) container.removeChild(container.firstChild);
    const meContact = { id: 'me', name: appData.myProfile.name, avt: appData.myProfile.avt, members: null };
    const allContacts = [meContact, ...appData.users, ...appData.groups];

    const getDefaultAvatarSVG = (contact) => {
        if (contact.members) {
            return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="17" cy="7" r="3"/><path d="M23 21v-2a3 3 0 0 0-3-3h-1"/></svg>';
        } else {
            return '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>';
        }
    };

    allContacts.forEach(contact => {
        if (appData.hiddenChats.includes(contact.id)) return;
        const item = document.createElement('div'); item.className = 'chat-item'; item.dataset.id = contact.id;
        if (window._navBgImageMode && window._navBgImageMode['contacts']) {
          item.style.borderBottomColor = 'transparent';
          item.style.background = 'rgba(255,255,255,0.15)';
        }
        const avatar = document.createElement('div'); avatar.className = 'avatar';
        if (contact.avt) {
            const img = document.createElement('img'); img.src = contact.avt;
            img.onerror = function() { this.style.display = 'none'; avatar.innerHTML = getDefaultAvatarSVG(contact); };
            avatar.appendChild(img);
        } else {
            avatar.innerHTML = getDefaultAvatarSVG(contact);
        }
        const info = document.createElement('div'); info.className = 'info';
        const nameDiv = document.createElement('div'); nameDiv.className = 'name'; nameDiv.textContent = contact.name;
if (window._navBgImageMode && window._navBgImageMode['contacts']) {
    nameDiv.style.textShadow = 'none';
    nameDiv.style.background = 'transparent';
}
        info.appendChild(nameDiv);
        item.appendChild(avatar); item.appendChild(info);
        item.onclick = (e) => {
            e.stopPropagation();
            if (contact.id === 'me') { currentChatId = 'me'; openChat(); } else if (contact.members) { currentChatId = contact.id; openChat(); } else { setTimeout(() => renderContactDetail(contact.id), 50); }
        };
        container.appendChild(item);
    });
    if (appData.hiddenChats.length > 0) {
        const sep = document.createElement('div'); sep.style.cssText = 'padding:10px 12px;color:var(--text-secondary);font-size:13px;font-weight:bold;'; sep.textContent = '已隐藏'; container.appendChild(sep);
        allContacts.forEach(contact => {
            if (!appData.hiddenChats.includes(contact.id)) return;
            const item = document.createElement('div'); item.className = 'chat-item'; item.dataset.id = contact.id;
            if (window._navBgImageMode && window._navBgImageMode['contacts']) {
              item.style.borderBottomColor = 'transparent';
              item.style.background = 'rgba(255,255,255,0.15)';
            }
            const avatar = document.createElement('div'); avatar.className = 'avatar';
            if (contact.avt) {
                const img = document.createElement('img'); img.src = contact.avt;
                img.onerror = function() { this.style.display = 'none'; avatar.innerHTML = getDefaultAvatarSVG(contact); };
                avatar.appendChild(img);
            } else {
                avatar.innerHTML = getDefaultAvatarSVG(contact);
            }
            const info = document.createElement('div'); info.className = 'info';
            const nameDiv = document.createElement('div'); nameDiv.className = 'name'; nameDiv.textContent = contact.name;
if (window._navBgImageMode && window._navBgImageMode['contacts']) {
    nameDiv.style.textShadow = 'none';
    nameDiv.style.background = 'transparent';
} nameDiv.style.opacity = '0.5';
            info.appendChild(nameDiv);
            const unhideSpan = document.createElement('div'); unhideSpan.style.cssText = 'font-size:10px;color:var(--accent)'; unhideSpan.textContent = '点击取消隐藏';
            info.appendChild(unhideSpan);
            item.appendChild(avatar); item.appendChild(info);
            item.onclick = (e) => { e.stopPropagation(); window.unhideChat(contact.id); };
            container.appendChild(item);
        });
    }
}

function renderContactDetail(userId) {
    const u = getContact(userId); if (!u || u.id === 'me') return;
    document.getElementById('contactsPage').classList.remove('active');
    document.getElementById('contactDetailPage').classList.add('active');
    document.getElementById('contactDetailTitle').textContent = u.name;
    const content = document.getElementById('contactDetailContent');
    while (content.firstChild) content.removeChild(content.firstChild);

    const avatarDiv = document.createElement('div'); avatarDiv.className = 'avatar';
    if (u.avt) {
        const img = document.createElement('img'); img.src = u.avt;
        img.onerror = function() { this.style.display = 'none'; avatarDiv.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>'; };
        avatarDiv.appendChild(img);
    } else {
        avatarDiv.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>';
    }
    content.appendChild(avatarDiv);

    const nameRow = document.createElement('div'); nameRow.style.cssText = 'display:flex;gap:6px;align-items:center;padding:4px 0';
    const nameInput = document.createElement('input'); nameInput.id = 'cdName'; nameInput.value = u.name; nameInput.style.cssText = 'flex:1;border-radius:14px;border:1px solid var(--border-light);padding:6px';
    const nameSaveBtn = document.createElement('button'); nameSaveBtn.className = 'btn-primary'; nameSaveBtn.textContent = '保存昵称';
    nameSaveBtn.onclick = () => { const n = nameInput.value.trim(); if (n && n !== u.name) { u.name = n; markDataChanged(); save(); document.getElementById('contactDetailTitle').textContent = u.name; renderContactList(); updateAllNicknames(u); toast('昵称已更新'); } else if (n === u.name) toast('昵称未变更'); };
    nameRow.appendChild(nameInput); nameRow.appendChild(nameSaveBtn);
    content.appendChild(nameRow);

    const sec1 = document.createElement('div'); sec1.className = 'section-title'; sec1.textContent = '个人信息'; content.appendChild(sec1);
    [
        { text: '换头像', icon: 'camera', action: () => { const capturedUserId = userId; document.getElementById('fileAvatar')._capturedUserId = capturedUserId; document.getElementById('fileAvatar').click(); } },
        { text: '朋友圈', icon: 'sun', action: () => { openMomentsPage(userId, false); _momentsFromContactDetail = true; } }
    ].forEach(b => {
        const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        btn.onclick = b.action; content.appendChild(btn);
    });

    const sec2 = document.createElement('div'); sec2.className = 'section-title'; sec2.textContent = '背景与图库'; content.appendChild(sec2);
    [
        { text: '朋友圈背景', icon: 'image', action: () => { window.setMomentsBg(userId); } },
        { text: '换聊天背景', icon: 'image', action: () => { bgUploadTargetId = userId; document.getElementById('fileBg').click(); } },
        { text: '背景图库', icon: 'folder', action: () => { openContactBgPage(userId); } }
    ].forEach(b => {
        const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        btn.onclick = b.action; content.appendChild(btn);
    });

    const sec3 = document.createElement('div'); sec3.className = 'section-title'; sec3.textContent = '回复与通知'; content.appendChild(sec3);

    [
        { text: '字卡设置', icon: 'book-open', action: () => { openUserCardsPage(userId, 'contact'); } },
        { text: '消息提示音: ' + (u.soundEnabled !== false ? '开' : '关'), icon: 'volume-2', action: function() { u.soundEnabled = u.soundEnabled === false; markDataChanged(); save(); this.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('volume-2')}</svg>消息提示音: ` + (u.soundEnabled !== false ? '开' : '关'); } },
        { text: '允许主动发消息: ' + (u.allowInitiative ? '开' : '关'), icon: 'user-plus', action: function() { u.allowInitiative = !u.allowInitiative; markDataChanged(); save(); this.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('user-plus')}</svg>允许主动发消息: ` + (u.allowInitiative ? '开' : '关'); } }
    ].forEach(b => {
        const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
        btn.onclick = b.action;
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        content.appendChild(btn);
    });

    const noReplyBtn = document.createElement('button'); noReplyBtn.className = 'btn'; noReplyBtn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
    noReplyBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('bell-off')}</svg>已读不回: ` + (u.noReply ? '开' : '关');
    noReplyBtn.onclick = function() { u.noReply = !u.noReply; markDataChanged(); save(); this.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('bell-off')}</svg>已读不回: ` + (u.noReply ? '开' : '关'); };
    content.appendChild(noReplyBtn);

    const noDisturbBtn = document.createElement('button'); noDisturbBtn.className = 'btn'; noDisturbBtn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
    noDisturbBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('phone-off')}</svg>免打扰: ` + (u.noDisturb ? '开' : '关');
    noDisturbBtn.onclick = function() { u.noDisturb = !u.noDisturb; markDataChanged(); save(); this.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('phone-off')}</svg>免打扰: ` + (u.noDisturb ? '开' : '关'); };
    content.appendChild(noDisturbBtn);

    const mutedBtn = document.createElement('button'); mutedBtn.className = 'btn'; mutedBtn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
    mutedBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('volume-x')}</svg>禁止回复: ` + (u.muted ? '开' : '关');
    mutedBtn.onclick = function() { u.muted = !u.muted; markDataChanged(); save(); this.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('volume-x')}</svg>禁止回复: ` + (u.muted ? '开' : '关'); };
    content.appendChild(mutedBtn);

    const badgeSettingBtn = document.createElement('button'); badgeSettingBtn.className = 'btn'; badgeSettingBtn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
    const badgeEnabled = appData.unreadBadgeSettings[userId] !== false;
    const updateBadgeBtn = () => { const enabled = appData.unreadBadgeSettings[userId] !== false; badgeSettingBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('circle')}</svg>未读角标: ` + (enabled ? '开' : '关'); };
    updateBadgeBtn();
    badgeSettingBtn.onclick = () => { if (badgeEnabled) { appData.unreadBadgeSettings[userId] = false; } else { delete appData.unreadBadgeSettings[userId]; } markDataChanged(); save(); updateBadgeBtn(); renderChatList(); };
    content.appendChild(badgeSettingBtn);

    const ruleDiv = document.createElement('div'); ruleDiv.style.cssText = 'padding:8px 12px;background:var(--primary-bg);border-radius:12px;margin:4px 0';
    ruleDiv.innerHTML = `<div style="font-size:13px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;">${getIconSVG('clock')}</svg>回复速度</div>
    <div class="inline-input-row">最小<input id="cdMin" type="number" value="${u.rule.min}" style="width:45px">秒 最大<input id="cdMax" type="number" value="${u.rule.max}" style="width:45px">秒</div>
    <div class="inline-input-row">最少<input id="cdCntMin" type="number" value="${u.rule.cntMin}" style="width:45px">条 最多<input id="cdCntMax" type="number" value="${u.rule.cntMax}" style="width:45px">条 <button class="btn btn-primary" id="cdRuleSave">保存</button></div>`;
    content.appendChild(ruleDiv);
    setTimeout(() => { document.getElementById('cdRuleSave').onclick = () => { u.rule.min = parseInt(document.getElementById('cdMin').value) || 30; u.rule.max = parseInt(document.getElementById('cdMax').value) || 60; u.rule.cntMin = parseInt(document.getElementById('cdCntMin').value) || 3; u.rule.cntMax = parseInt(document.getElementById('cdCntMax').value) || 5; markDataChanged(); save(); toast('回复速度已更新'); }; }, 100);

    const combineDiv = document.createElement('div'); combineDiv.style.cssText = 'padding:8px 12px;background:var(--primary-bg);border-radius:12px;margin:4px 0';
    const currentMin = u.combineMin || appData.globalRule.combineMin || 1;
    const currentMax = u.combineMax || appData.globalRule.combineMax || 3;
    combineDiv.innerHTML = `<div style="font-size:13px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;">${getIconSVG('type')}</svg>拼词条数</div>
    <div class="inline-input-row">
      <input id="cdCombineMin" type="number" value="${currentMin}" min="1" max="20" style="width:50px">
      <span>~</span>
      <input id="cdCombineMax" type="number" value="${currentMax}" min="1" max="20" style="width:50px">
      <button class="btn btn-primary" id="cdCombineSave">保存</button>
    </div>`;
    content.appendChild(combineDiv);
    setTimeout(() => { document.getElementById('cdCombineSave').onclick = () => { const minVal = parseInt(document.getElementById('cdCombineMin').value) || 1; const maxVal = parseInt(document.getElementById('cdCombineMax').value) || 3; u.combineMin = Math.max(1, Math.min(20, minVal)); u.combineMax = Math.max(u.combineMin, Math.min(20, maxVal)); markDataChanged(); save(); toast(`拼词条数设为 ${u.combineMin}~${u.combineMax} 条`); }; }, 100);

    const sec4 = document.createElement('div'); sec4.className = 'section-title'; sec4.textContent = '备份与导入'; content.appendChild(sec4);
    [
        { text: '备份联系人', icon: 'user', action: () => { exportContactData(userId); } },
        { text: '导入到联系人', icon: 'download', action: () => { document.getElementById('contactRestoreInput')._contactId = userId; document.getElementById('contactRestoreInput').click(); } },
        { text: '备份联系人字卡', icon: 'book-open', action: () => { exportContactCards(userId); } },
        { text: '导入联系人字卡', icon: 'download', action: () => { document.getElementById('restoreCardsInput')._contactId = userId; document.getElementById('restoreCardsInput').click(); } },
        { text: '备份联系人表情', icon: 'smile', action: () => { exportContactEmojis(userId); } },
        { text: '导入联系人表情', icon: 'download', action: () => { document.getElementById('restoreEmojisInput')._contactId = userId; document.getElementById('restoreEmojisInput').click(); } },
        { text: '备份联系人聊天', icon: 'message-circle', action: () => { exportContactChat(userId); } },
        { text: '导入联系人聊天', icon: 'download', action: () => { document.getElementById('restoreChatInput')._contactId = userId; document.getElementById('restoreChatInput').click(); } },
        { text: '语音库管理', icon: 'mic', action: () => { openVoiceManagerPage(userId); } },
        { text: '导入语音库', icon: 'mic', action: () => { importUserVoices(userId); } },
        { text: '导出语音库', icon: 'upload', action: () => { exportUserVoices(userId); } },
        { text: '导入语音库备份', icon: 'download', action: () => { importUserVoicesJSON(userId); } }
    ].forEach(b => {
        const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        btn.onclick = b.action; content.appendChild(btn);
    });

    const sec5 = document.createElement('div'); sec5.className = 'section-title'; sec5.textContent = '其他'; content.appendChild(sec5);
    const delBtn = document.createElement('button'); delBtn.className = 'btn'; delBtn.style.cssText = 'width:100%;text-align:left;display:flex;align-items:center;color:#f44336';
    delBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2" style="margin-right:6px;flex-shrink:0;color:#f44336;">${getIconSVG('trash-2')}</svg>删除联系人`;
    delBtn.onclick = () => { deleteContact(userId); };
    content.appendChild(delBtn);

    if (u.members) {
        content.appendChild(document.createElement('hr'));
        const memTitle = document.createElement('div'); memTitle.textContent = '群成员'; memTitle.style.fontWeight = 'bold'; content.appendChild(memTitle);
        u.members.forEach(mid => { const m = getContact(mid); if (m) { const div = document.createElement('div'); div.textContent = m.name; content.appendChild(div); } });
    }
}

function importUserVoices(userId) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*'; input.multiple = true;
    input.onchange = async function(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        if (!appData.userVoices[userId]) appData.userVoices[userId] = [];
        let added = 0;
        for (const f of files) {
            try {
                const reader = new FileReader();
                const b64 = await new Promise((resolve) => { reader.onload = (ev) => resolve(ev.target.result); reader.readAsDataURL(f); });
                appData.userVoices[userId].push({ name: f.name, data: b64 });
                added++;
            } catch { toast('导入失败'); }
        }
        markDataChanged(); save();
        toast(`已导入 ${added} 条语音`);
        if (document.getElementById('voiceManagerPage').classList.contains('active')) { renderVoiceManagerPage(userId); }
    };
    input.click();
}

function exportUserVoices(userId) {
    const u = getContact(userId); if (!u) return;
    const voices = appData.userVoices[userId] || [];
    if (voices.length === 0) { toast('该梦角没有语音可导出'); return; }
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`;
    const exportData = JSON.parse(JSON.stringify(voices.map(v => ({ name: v.name, data: v.data }))));
    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Mo_voices_${u.name}_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href);
    toast('语音库已导出');
}
function importUserVoicesJSON(userId) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const arr = JSON.parse(ev.target.result);
                if (!Array.isArray(arr)) { toast('格式错误：需要 JSON 数组'); return; }
                if (!appData.userVoices[userId]) appData.userVoices[userId] = [];
                const current = appData.userVoices[userId];
                let added = 0, skipped = 0;
                arr.forEach(item => {
                    if (item.name && item.data) {
                        const exists = current.some(v => v.name === item.name && v.data === item.data);
                        if (exists) { skipped++; } else { current.push({ name: item.name, data: item.data }); added++; }
                    }
                });
                markDataChanged(); save();
                let msg = `导入完成：添加 ${added} 条`;
                if (skipped > 0) msg += `，跳过 ${skipped} 条重复`;
                toast(msg);
                if (document.getElementById('voiceManagerPage').classList.contains('active')) { renderVoiceManagerPage(userId); }
            } catch (e) { toast('文件损坏，无法解析'); }
        };
        reader.readAsText(file); input.remove();
    };
    input.click();
}

// ========== 我的页面 ==========
function openMyProfile() {
    document.getElementById('mePage').classList.add('active');
    document.getElementById('chatsPage').classList.remove('active');
    document.getElementById('contactsPage').classList.remove('active');
    document.getElementById('discoverPage').classList.remove('active');
    document.getElementById('momentsPage').classList.remove('active');
    renderMePage();
}

function renderMePage() {
    const container = document.getElementById('mePageContent');
    while (container.firstChild) container.removeChild(container.firstChild);
    currentChatId = 'me';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`;
    const totalSecs = appData.autoBackupIntervalSecs || 60;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const avatarDiv = document.createElement('div'); avatarDiv.className = 'avatar'; avatarDiv.id = 'myProfileAvatar'; avatarDiv.style.cssText = 'width:80px;height:80px;margin:10px auto;color:var(--theme);';
    if (appData.myProfile.avt) {
        const img = document.createElement('img'); img.src = appData.myProfile.avt;
        img.onerror = function() { this.style.display = 'none'; avatarDiv.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>'; };
        avatarDiv.appendChild(img);
    } else {
        avatarDiv.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21c0-4.5 3-7 6.5-7s6.5 2.5 6.5 7"/></svg>';
    }
    container.appendChild(avatarDiv);

    const nameInput = document.createElement('input'); nameInput.id = 'myname'; nameInput.value = appData.myProfile.name; nameInput.style.cssText = 'width:90%;margin:6px auto;border-radius:14px;border:1px solid var(--border-light);padding:8px;display:block';
    container.appendChild(nameInput);
    const nameBtn = document.createElement('button'); nameBtn.className = 'btn'; nameBtn.textContent = '改昵称'; nameBtn.style.cssText = 'margin:0 auto;display:block';
    nameBtn.onclick = () => { const n = nameInput.value.trim(); if (n && n !== appData.myProfile.name) { appData.myProfile.name = n; markDataChanged(); save(); updateAllNicknames(appData.myProfile); renderContactList(); toast('昵称已更新'); } };
    container.appendChild(nameBtn);

    const sec1 = document.createElement('div'); sec1.className = 'section-title'; sec1.textContent = '个人信息'; container.appendChild(sec1);
    [
        { text: '换头像', icon: 'camera', action: () => { document.getElementById('fileAvatar')._capturedUserId = 'me'; document.getElementById('fileAvatar').click(); } },
        { text: '我的朋友圈', icon: 'sun', action: () => { openMomentsPage('me', false); } },
        { text: '签名: ' + (appData.myProfile.signature || '未设置'), icon: 'edit-3', action: () => { showInputDialog('个性签名', appData.myProfile.signature || '', (val) => { appData.myProfile.signature = val; markDataChanged(); save(); renderMePage(); }); } },
        { text: '状态: ' + appData.myProfile.status, icon: 'circle', action: () => { const sel = document.createElement('select'); STATUS_LIST.forEach(st => { const o = document.createElement('option'); o.value = st; o.textContent = st; if (st === appData.myProfile.status) o.selected = true; sel.appendChild(o); }); const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const hd = document.createElement('div'); hd.className = 'pop-header'; hd.textContent = '选择状态'; card.appendChild(hd); const bd = document.createElement('div'); bd.className = 'pop-body'; bd.appendChild(sel); card.appendChild(bd); const ft = document.createElement('div'); ft.className = 'pop-footer'; const ok = document.createElement('button'); ok.className = 'btn-primary'; ok.textContent = '确定'; ok.onclick = () => { appData.myProfile.status = sel.value; markDataChanged(); save(); overlay.remove(); renderMePage(); }; ft.appendChild(ok); card.appendChild(ft); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); } }
    ].forEach(b => {
        const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        btn.onclick = b.action; container.appendChild(btn);
    });

    const appearanceTitle = document.createElement('div'); appearanceTitle.className = 'section-title'; appearanceTitle.textContent = '外观设置'; container.appendChild(appearanceTitle);
    const themeEntryBtn = document.createElement('button'); themeEntryBtn.className = 'btn'; themeEntryBtn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left;font-size:14px;';
    themeEntryBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('palette')}</svg>主题与气泡`;
    themeEntryBtn.onclick = () => { document.getElementById('mePage').classList.remove('active'); openThemePage(); };
    container.appendChild(themeEntryBtn);
    if (typeof addThemeSectionButtons === 'function') addThemeSectionButtons(container);

    const sec2 = document.createElement('div'); sec2.className = 'section-title'; sec2.textContent = '背景与图库'; container.appendChild(sec2);
    [
        { text: '换聊天背景', icon: 'image', action: () => { bgUploadTargetId = 'me'; document.getElementById('fileBg').click(); } },
        { text: '我的背景库', icon: 'folder', action: () => { openMyBgPage(); } },
        { text: '我的朋友圈背景', icon: 'image', action: () => { window.setMomentsBg('me'); } }
    ].forEach(b => {
        const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        btn.onclick = b.action; container.appendChild(btn);
    });

    const sec3 = document.createElement('div'); sec3.className = 'section-title'; sec3.textContent = '数据管理'; container.appendChild(sec3);
    [
        { text: '全局字卡库', icon: 'book-open', action: () => { openGlobalCardsPage('me'); } },
        { text: '表情管理', icon: 'smile', action: () => { openEmojiManagerPage(); } },
        { text: '屏蔽词管理', icon: 'slash', action: () => { openBlockedPage(); } },
        { text: '备份字卡', icon: 'book-open', action: () => { const blob = new Blob([JSON.stringify({ globalCardGroups: appData.globalCardGroups })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Mo_cards_backup_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href); toast('字卡备份已准备'); } },
        { text: '导入字卡', icon: 'download', action: () => { document.getElementById('restoreCardsInput').click(); } },
        { text: '备份表情', icon: 'smile', action: () => { const blob = new Blob([JSON.stringify({ globalEmojis: appData.globalEmojis, userEmo: appData.userEmo })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Mo_emojis_backup_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href); toast('表情备份已准备'); } },
        { text: '导入表情', icon: 'download', action: () => { document.getElementById('restoreEmojisInput').click(); } },
        { text: '备份聊天', icon: 'message-circle', action: () => { const blob = new Blob([JSON.stringify({ msg: appData.msg })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Mo_chat_backup_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href); toast('聊天备份已准备'); } },
        { text: '导入聊天', icon: 'download', action: () => { document.getElementById('restoreChatInput').click(); } },
        { text: '备份全部数据', icon: 'save', action: () => { performBackup(false); } },
        { text: '导入全部备份', icon: 'download', action: () => { document.getElementById('restoreFileInput').click(); } },
        { text: '精简备份', icon: 'archive', action: () => { performCompactBackup(); } }
    ].forEach(b => {
        const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG(b.icon)}</svg>${b.text}`;
        btn.onclick = b.action; container.appendChild(btn);
    });

    const sec4 = document.createElement('div'); sec4.className = 'section-title'; sec4.textContent = '备份设置'; container.appendChild(sec4);
    const backupDiv = document.createElement('div'); backupDiv.style.cssText = 'padding:8px 12px;background:var(--primary-bg);border-radius:12px;margin:0 12px 8px';
    backupDiv.innerHTML = `<div style="font-size:13px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;">${getIconSVG('clock')}</svg>自动备份间隔</div>
    <div class="inline-input-row"><input id="autoBackupH" type="number" value="${h}" style="width:45px" min="0" max="23"> 时 <input id="autoBackupM" type="number" value="${m}" style="width:45px" min="0" max="59"> 分 <input id="autoBackupS" type="number" value="${s}" style="width:45px" min="0" max="59"> 秒 <button class="btn btn-primary" id="saveBackupInterval">保存</button></div>`;
    container.appendChild(backupDiv);
    setTimeout(() => { document.getElementById('saveBackupInterval').onclick = () => { const hVal = parseInt(document.getElementById('autoBackupH').value) || 0; const mVal = parseInt(document.getElementById('autoBackupM').value) || 0; const sVal = parseInt(document.getElementById('autoBackupS').value) || 0; const totalSecs = hVal * 3600 + mVal * 60 + sVal; if (totalSecs < 1) { toast('间隔不能小于1秒'); return; } appData.autoBackupIntervalSecs = totalSecs; markDataChanged(); save(); if (appData.autoBackupEnabled) { stopAutoBackup(); startAutoBackup(); } toast(`自动备份间隔已设为 ${hVal}时${mVal}分${sVal}秒`); }; }, 100);

    const autoToggleBtn = document.createElement('button'); autoToggleBtn.className = 'btn'; autoToggleBtn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
    const updateAutoToggleBtn = () => { if (appData.autoBackupEnabled) { autoToggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('pause-circle')}</svg>暂停自动备份`; } else { autoToggleBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('play-circle')}</svg>开启自动备份`; } };
    updateAutoToggleBtn();
    autoToggleBtn.onclick = () => { appData.autoBackupEnabled = !appData.autoBackupEnabled; markDataChanged(); save(); if (appData.autoBackupEnabled) startAutoBackup(); else stopAutoBackup(); updateAutoToggleBtn(); };
    container.appendChild(autoToggleBtn);

    const volumeDiv = document.createElement('div'); volumeDiv.style.cssText = 'padding:8px 12px;background:var(--primary-bg);border-radius:12px;margin:4px 12px';
    volumeDiv.innerHTML = `<div style="font-size:13px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;">${getIconSVG('volume-2')}</svg>音量</div>`;
    const sliderRow = document.createElement('div'); sliderRow.style.cssText = 'display:flex;align-items:center;gap:10px;';
    const slider = document.createElement('input'); slider.type = 'range'; slider.min = '0'; slider.max = '100'; slider.value = Math.round((appData.soundVolume || 0.5) * 100);
    slider.style.cssText = 'flex:1;height:6px;-webkit-appearance:none;appearance:none;background:var(--theme-light);border-radius:3px;outline:none;';
    const volLabel = document.createElement('span'); volLabel.textContent = slider.value + '%'; volLabel.style.cssText = 'min-width:40px;text-align:center;font-size:13px;font-weight:500;color:var(--theme-dark);background:var(--theme-light);padding:2px 8px;border-radius:10px;';
    slider.oninput = function() { volLabel.textContent = this.value + '%'; appData.soundVolume = parseInt(this.value) / 100; playSound('message'); };
    slider.onchange = function() { markDataChanged(); save(); };
    sliderRow.appendChild(slider); sliderRow.appendChild(volLabel); volumeDiv.appendChild(sliderRow); container.appendChild(volumeDiv);

    const sec5 = document.createElement('div'); sec5.className = 'section-title'; sec5.textContent = '其他'; container.appendChild(sec5);
    const globalBadgeBtn = document.createElement('button'); globalBadgeBtn.className = 'btn'; globalBadgeBtn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
    const updateBadgeBtnText = () => { globalBadgeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('bell')}</svg>全局未读角标: ` + (appData.globalUnreadBadgeEnabled ? '开' : '关'); };
    updateBadgeBtnText();
    globalBadgeBtn.onclick = () => { appData.globalUnreadBadgeEnabled = !appData.globalUnreadBadgeEnabled; markDataChanged(); save(); updateBadgeBtnText(); renderChatList(); toast(appData.globalUnreadBadgeEnabled ? '已开启所有角标' : '已关闭所有角标'); };
    container.appendChild(globalBadgeBtn);

    const limitEmojiBtn = document.createElement('button'); limitEmojiBtn.className = 'btn'; limitEmojiBtn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
    const updateLimitEmojiBtn = () => { limitEmojiBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('smile')}</svg>限制每条消息emoji数量: ` + (appData.limitEmojiPerMsg ? '开' : '关'); };
    updateLimitEmojiBtn();
    limitEmojiBtn.onclick = () => { appData.limitEmojiPerMsg = !appData.limitEmojiPerMsg; markDataChanged(); save(); updateLimitEmojiBtn(); toast(appData.limitEmojiPerMsg ? '已开启emoji限制，每条回复最多1个' : '已关闭emoji限制'); };
    container.appendChild(limitEmojiBtn);

    const resetBtn = document.createElement('button'); resetBtn.className = 'btn reset-btn-red'; resetBtn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left;color:#f44336';
    resetBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('trash-2')}</svg>重置数据`;
    resetBtn.onclick = () => {
    showConfirm('重置所有数据？', () => {
        indexedDB.deleteDatabase(DB_NAME);
        appData = {
            globalCardGroups: JSON.parse(JSON.stringify(DEFAULT_CARDS)),
            globalRule: { min: 30, max: 60, cntMin: 3, cntMax: 5, combineMin: 1, combineMax: 3 },
            myProfile: { id: 'me', name: '我', avt: '', signature: '', status: '在线' },
            users: [], groups: [], userEmo: {}, userImages: {}, globalEmojis: [], msg: {}, moments: {},
            letters: {}, letterDrafts: {}, momentsBg: '', hiddenGlobalEmojis: {},
            userDailyCommentCount: {}, disabledGlobalCards: [], disabledUserCards: {},
            quoteHistory: {}, blockedKeywords: [], userBgs: {}, momentsBgs: {}, lastUserMsgTime: {},
            userSoundSettings: {}, autoBackupEnabled: true, autoBackupIntervalSecs: 60, soundVolume: 0.5,
            dataChanged: false, lastBackupTime: Date.now(), hiddenChats: [],
            musicPlaylists: [{ name: "默认歌单", songs: [] }],
            bookLists: [{ name: "默认书单", books: [] }],
            movieLists: [{ name: "默认电影列表", movies: [] }],
            companionTasks: [],
            tarotCards: { tarot: [...BUILTIN_TAROT], lenormand: [...BUILTIN_LENORMAND] },
            userVoices: {}, unreadBadgeSettings: {}, themeColor: '#c5a47e'
        };
        appData.users.push(
            { id: 'u1', name: '梦角1', avt: '', bg: '', status: '在线', cardGroups: [{ name: '未分组', list: [] }], rule: { min: 30, max: 60, cntMin: 3, cntMax: 5 }, noReply: false, noDisturb: true, allowInitiative: true, soundEnabled: true, replyTime: 86400, muted: false },
            { id: 'u2', name: '梦角2', avt: '', bg: '', status: '忙碌', cardGroups: [{ name: '未分组', list: [] }], rule: { min: 30, max: 60, cntMin: 3, cntMax: 5 }, noReply: false, noDisturb: true, allowInitiative: true, soundEnabled: true, replyTime: 86400, muted: false }
        );
        save();
        try { localStorage.removeItem('Mo_theme_backup'); } catch (e) {}
        applyTheme('#c5a47e');
        currentChatId = null; currentMomentUserId = 'me'; selectedCards.clear(); letterUndoStack = []; letterRedoStack = []; draftUndoStacks = {}; draftRedoStacks = {};
        document.getElementById('chatsPage').classList.add('active');
        document.getElementById('chatPage').classList.remove('active');
        document.getElementById('contactsPage').classList.remove('active');
        document.getElementById('contactDetailPage').classList.remove('active');
        document.getElementById('discoverPage').classList.remove('active');
        document.getElementById('momentsPage').classList.remove('active');
        document.getElementById('mePage').classList.remove('active');
        document.getElementById('mailboxPage').classList.remove('active');
        document.getElementById('letterPage').classList.remove('active');
        document.getElementById('globalMask').classList.remove('show');
        renderChatList(); renderContactList();
        
        // 强制所有页面和内容区恢复白色背景
        document.querySelectorAll('.page-bg-overlay').forEach(el => el.remove());
        window._navBgImageMode = {};
        window._currentSchemeSecondaryColor = '';
        document.documentElement.style.setProperty('--border-light', '#e9eef3');
        
        ['chatsPage','contactsPage','discoverPage','mePage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.backgroundImage = '';
                el.style.background = '';
                el.style.backgroundColor = '#ffffff';
            }
        });
        ['chatListContainer','contactListContainer','discoverListContainer','mePageContent'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.background = '#ffffff';
                el.style.backgroundColor = '#ffffff';
            }
        });
        
        toast('数据已重置');
    });
};
    container.appendChild(resetBtn);
}

// ========== 联系人导出 ==========
function exportContactCards(userId) {
    const u = getContact(userId); if (!u) return;
    const now = new Date(); const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; const timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`;
    const blob = new Blob([JSON.stringify({ cardGroups: u.cardGroups })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Mo_contact_cards_${u.name}_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href); toast('联系人字卡已备份');
}
function exportContactEmojis(userId) {
    const u = getContact(userId); if (!u) return;
    const now = new Date(); const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; const timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`;
    const blob = new Blob([JSON.stringify({ emojis: appData.userEmo[userId] || [], images: appData.userImages[userId] || [] })], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Mo_contact_emojis_${u.name}_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href); toast('联系人表情已备份');
}
function exportContactChat(userId) {
    const u = getContact(userId); if (!u) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`;

    // 1. 取出并深拷贝聊天记录
    const rawChat = appData.msg[userId] || [];
    const chatForExport = JSON.parse(JSON.stringify(rawChat));

    // 2. 把媒体引用替换为真实数据 (需要套在 async 自执行函数里)
    (async () => {
        for (const msg of chatForExport) {
            if (msg.image && typeof msg.image === 'string' && msg.image.startsWith('img_')) {
                try { const b64 = await loadMedia(msg.image); if (b64) msg.image = b64; } catch (e) {}
            }
            if (msg.voice && typeof msg.voice === 'string' && msg.voice.startsWith('voice_')) {
                try { const b64 = await loadMedia(msg.voice); if (b64) msg.voice = b64; } catch (e) {}
            }
        }
        // 处理完后再下载
        const blob = new Blob([JSON.stringify({ chat: chatForExport })], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `Mo_contact_chat_${u.name}_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href);
        toast('联系人聊天已备份');
    })();
}

// ========== 朋友圈 ==========
function openMomentsPage(userId = null, backToMain = false) {
    try {
        if (userId) currentMomentUserId = userId;
        if (!currentMomentUserId) currentMomentUserId = 'me';
        momentsBackToMain = backToMain;
        _momentsFromChat = document.getElementById('chatPage').classList.contains('active');
        if (!_momentsFromChat && document.getElementById('contactDetailPage').classList.contains('active')) {
            _momentsFromContactDetail = true;
        } else { _momentsFromContactDetail = false; }
        document.querySelectorAll('.mask.show').forEach(m => m.remove());
        document.getElementById('chatsPage').classList.remove('active');
        document.getElementById('chatPage').classList.remove('active');
        document.getElementById('discoverPage').classList.remove('active');
        document.getElementById('momentsPage').classList.add('active');
        const contact = getContact(currentMomentUserId);
        document.getElementById('momentsTitle').innerText = currentMomentUserId === 'me' ? '我的朋友圈' : (contact?.name || '朋友圈');
        let bg = appData.momentsBgs[currentMomentUserId];
        if (!bg || !bg.startsWith('data:image/') || bg.length < 200) { bg = (currentMomentUserId !== 'me') ? appData.momentsBg : ''; }
        const container = document.getElementById('momentsListContainer');
        container.style.backgroundImage = bg ? `url(${bg})` : 'none';
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        let overlay = container.querySelector('.moments-overlay');
        if (!overlay) {
            overlay = document.createElement('div'); overlay.className = 'moments-overlay';
            overlay.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.3);pointer-events:none;z-index:0;';
            container.appendChild(overlay);
        }
        document.getElementById('momentsPublishBtn').onclick = showMomentPublish;
        renderMomentsList();
        applyTransparency();
    } catch (e) { toast('朋友圈打开失败'); }
}

function renderMomentsList() {
    const c = document.getElementById('momentsListContainer');
    while (c.firstChild) c.removeChild(c.firstChild);
    const overlay = document.createElement('div'); overlay.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.3);pointer-events:none;z-index:0;'; c.appendChild(overlay);
    const moments = appData.moments[currentMomentUserId] || [];
    [...moments].reverse().forEach((m, i) => {
        const realIdx = moments.length - 1 - i;
        const author = getContact(currentMomentUserId);
        const avt = author?.avt || m.avatar || '';
        const name = author?.name || m.name || '';
        const div = document.createElement('div'); div.style.cssText = 'padding:12px;border-bottom:1px solid var(--border-light);background:rgba(255,255,255,0.85);position:relative;';
        const headerDiv = document.createElement('div'); headerDiv.style.cssText = 'display:flex;align-items:center;gap:10px';
        const avatarDiv = document.createElement('div'); avatarDiv.className = 'avatar'; avatarDiv.style.cssText = 'width:40px;height:40px';
        if (avt) { const img = document.createElement('img'); img.src = avt; avatarDiv.appendChild(img); } else { avatarDiv.textContent = name[0]; }
        headerDiv.appendChild(avatarDiv);
        const nameDiv = document.createElement('div'); const nameSpan = document.createElement('div'); nameSpan.className = 'name'; nameSpan.textContent = name;
        if (author?.status) { const statusTag = document.createElement('span'); statusTag.className = 'status-tag'; statusTag.textContent = author.status; nameSpan.appendChild(statusTag); }
        nameDiv.appendChild(nameSpan);
        const timeDiv = document.createElement('div'); timeDiv.style.cssText = 'font-size:11px;color:var(--text-secondary)'; timeDiv.textContent = new Date(m.time).toLocaleString();
        nameDiv.appendChild(timeDiv); headerDiv.appendChild(nameDiv); div.appendChild(headerDiv);
        const textDiv = document.createElement('div'); textDiv.style.marginTop = '6px'; textDiv.textContent = m.text; div.appendChild(textDiv);
        if (m.images && m.images.length) {
            const imgRow = document.createElement('div'); imgRow.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-top:6px';
            m.images.forEach(img => { const imgEl = document.createElement('img'); imgEl.src = img; imgEl.className = 'moment-img'; imgRow.appendChild(imgEl); });
            div.appendChild(imgRow);
        }
        const actions = document.createElement('div'); actions.className = 'moment-actions';
        const likeSpan = document.createElement('span'); likeSpan.textContent = `❤️ ${m.likes || 0}`; likeSpan.onclick = () => window.likeMoment(realIdx);
        const commentSpan = document.createElement('span'); commentSpan.textContent = `💬 ${(m.comments || []).length}`; commentSpan.onclick = () => window.commentMoment(realIdx);
        actions.appendChild(likeSpan); actions.appendChild(commentSpan); div.appendChild(actions);
        if ((m.comments || []).length) {
            const commentsDiv = document.createElement('div'); commentsDiv.style.cssText = 'font-size:11px;color:var(--text-secondary);margin-top:4px';
            m.comments.forEach((c, ci) => {
                const commentUser = getContact(c.userId); const displayName = commentUser ? commentUser.name : (c.name || '');
                const cDiv = document.createElement('div'); const b = document.createElement('b'); b.textContent = displayName + ': ';
                cDiv.appendChild(b); cDiv.appendChild(document.createTextNode(c.text + ' '));
                const delSpan = document.createElement('span'); delSpan.style.cssText = 'cursor:pointer;color:#f44336;margin-left:4px'; delSpan.textContent = '🗑️'; delSpan.onclick = () => window.deleteComment(realIdx, ci);
                cDiv.appendChild(delSpan); commentsDiv.appendChild(cDiv);
            });
            div.appendChild(commentsDiv);
        }
        const delMomentSpan = document.createElement('span'); delMomentSpan.className = 'moment-delete'; delMomentSpan.textContent = '🗑️'; delMomentSpan.onclick = () => window.deleteMoment(realIdx);
        div.appendChild(delMomentSpan); c.appendChild(div);
    });
}
window.deleteMoment = index => showConfirm('删除这条动态？', () => { const arr = appData.moments[currentMomentUserId] || []; if (index >= 0 && index < arr.length) arr.splice(index, 1); markDataChanged(); save(); renderMomentsList(); });
window.deleteComment = (momentIndex, commentIndex) => showConfirm('删除这条评论？', () => { const arr = appData.moments[currentMomentUserId] || []; if (momentIndex >= 0 && momentIndex < arr.length && arr[momentIndex].comments) arr[momentIndex].comments.splice(commentIndex, 1); markDataChanged(); save(); renderMomentsList(); });

function showMomentPublish() {
    const m = document.getElementById('globalMask'); while (m.firstChild) m.removeChild(m.firstChild); m.className = 'mask show';
    const card = document.createElement('div'); card.className = 'pop-card';
    const header = document.createElement('div'); header.className = 'pop-header'; header.appendChild(document.createTextNode('发动态'));
    const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => m.classList.remove('show');
    header.appendChild(closeBtn); card.appendChild(header);
    const body = document.createElement('div'); body.className = 'pop-body';
    const textarea = document.createElement('textarea'); textarea.id = 'momentText'; textarea.rows = 3; textarea.placeholder = '分享文字...'; textarea.style.cssText = 'border-radius:12px;border:1px solid var(--border-light);padding:8px;width:100%';
    body.appendChild(textarea);
    const imgRow = document.createElement('div'); const addImgBtn = document.createElement('button'); addImgBtn.className = 'btn'; addImgBtn.textContent = '+图片';
    const imgCount = document.createElement('span'); imgCount.id = 'imgCount'; imgRow.appendChild(addImgBtn); imgRow.appendChild(imgCount); body.appendChild(imgRow);
    const imgInput = document.createElement('input'); imgInput.type = 'file'; imgInput.id = 'momentImgInput'; imgInput.accept = 'image/*'; imgInput.multiple = true; imgInput.style.display = 'none'; body.appendChild(imgInput);
    const preview = document.createElement('div'); preview.id = 'previewImgs'; preview.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px'; body.appendChild(preview); card.appendChild(body);
    const footer = document.createElement('div'); footer.className = 'pop-footer'; const publishBtn = document.createElement('button'); publishBtn.className = 'btn-primary'; publishBtn.textContent = '发布';
    footer.appendChild(publishBtn); card.appendChild(footer); m.appendChild(card);
    const selectedFiles = [];
    addImgBtn.onclick = () => imgInput.click();
    imgInput.onchange = function(e) { const newFiles = Array.from(e.target.files); selectedFiles.push(...newFiles); imgCount.textContent = `已选 ${selectedFiles.length} 张`; while (preview.firstChild) preview.removeChild(preview.firstChild); selectedFiles.forEach(f => { const img = document.createElement('img'); img.src = URL.createObjectURL(f); img.style.cssText = 'width:60px;height:60px;object-fit:cover;border-radius:8px'; preview.appendChild(img); }); e.target.value = ''; };
    publishBtn.onclick = async () => { const text = textarea.value.trim(); if (!text && !selectedFiles.length) { toast('内容不能为空'); return; } await publishMoment(text, selectedFiles); m.classList.remove('show'); };
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
    applyTransparency();
}

async function publishMoment(text, files) {
    const images = [];
    if (files && files.length) { for (const f of Array.from(files)) { try { const b64 = await processImage(f, 600); images.push(b64); } catch { toast('某图片处理失败'); } } }
    if (!appData.moments[currentMomentUserId]) appData.moments[currentMomentUserId] = [];
    const author = currentMomentUserId === 'me' ? appData.myProfile : getContact(currentMomentUserId);
    appData.moments[currentMomentUserId].unshift({ name: author.name, avatar: author.avt, status: author.status || '', text, images, time: new Date().toISOString(), likes: 0, likedBy: [], comments: [] });
    markDataChanged(); save(); renderMomentsList();
}
window.likeMoment = (index) => { const arr = appData.moments[currentMomentUserId] || []; if (index >= 0 && index < arr.length) { const m = arr[index]; if (!m.likedBy) m.likedBy = []; if (m.likedBy.includes(appData.myProfile.id)) { toast('你已经点过赞了'); return; } m.likes = (m.likes || 0) + 1; m.likedBy.push(appData.myProfile.id); markDataChanged(); save(); renderMomentsList(); } };
window.commentMoment = (index) => { const arr = appData.moments[currentMomentUserId] || []; if (index < 0 || index >= arr.length) return; showCommentDialog((text) => { if (!text) return; arr[index].comments.push({ name: appData.myProfile.name, userId: 'me', text, time: new Date().toISOString() }); markDataChanged(); save(); renderMomentsList(); }); };
function showCommentDialog(callback) {
    const overlay = document.createElement('div'); overlay.className = 'mask show';
    const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '300px';
    const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '评论'; card.appendChild(header);
    const body = document.createElement('div'); body.className = 'pop-body';
    const input = document.createElement('input'); input.id = 'commentInput'; input.placeholder = '输入评论...'; input.style.cssText = 'width:100%;border-radius:14px;border:1px solid var(--border-light);padding:6px'; body.appendChild(input);
    const mentionList = document.createElement('div'); mentionList.style.cssText = 'font-size:12px;margin-top:4px';
    ['me', ...appData.users.map(u => u.id)].forEach(id => { const n = id === 'me' ? '我' : getContact(id)?.name || id; const span = document.createElement('span'); span.style.cssText = 'cursor:pointer;color:var(--theme);margin:0 2px'; span.textContent = '@' + n; span.onclick = () => { input.value += ' @' + n + ' '; }; mentionList.appendChild(span); });
    body.appendChild(mentionList); card.appendChild(body);
    const footer = document.createElement('div'); footer.className = 'pop-footer';
    const okBtn = document.createElement('button'); okBtn.className = 'btn-primary'; okBtn.textContent = '确定';
    okBtn.onclick = () => { const v = input.value.trim(); overlay.remove(); callback(v); }; footer.appendChild(okBtn); card.appendChild(footer);
    overlay.appendChild(card); document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ========== 信箱 ==========
function openMailboxPage() {
    document.getElementById('discoverPage').classList.remove('active');
    document.getElementById('mailboxPage').classList.add('active');
    const container = document.getElementById('mailboxListContainer'); while (container.firstChild) container.removeChild(container.firstChild);
    appData.users.forEach(u => {
        const item = document.createElement('div'); item.className = 'chat-item'; item.dataset.id = u.id;
        const avatar = document.createElement('div'); avatar.className = 'avatar';
        if (u.avt) { const img = document.createElement('img'); img.src = u.avt; avatar.appendChild(img); } else { avatar.textContent = u.name[0]; }
        const info = document.createElement('div'); info.className = 'info'; const name = document.createElement('div'); name.className = 'name'; name.textContent = u.name;
        info.appendChild(name); item.appendChild(avatar); item.appendChild(info);
        item.onclick = () => { currentChatId = u.id; openLetterPage(currentChatId); }; container.appendChild(item);
    });
}

function openLetterPage(userId) {
    const target = getContact(userId);
    document.getElementById('mailboxPage').classList.remove('active');
    document.getElementById('letterPage').classList.add('active');
    document.getElementById('letterPageTitle').innerText = `与 ${target.name} 的信件`;
    renderLetterPage(userId);
}

let draftAutoSaveTimer = null;
function renderLetterPage(userId) {
    const area = document.getElementById('letterContentArea');
    const sentCount = (appData.letters[userId] || []).filter(l => l.from === 'me').length;
    const inboxCount = (appData.letters[userId] || []).filter(l => l.from !== 'me').length;
    const draftCount = (appData.letterDrafts[userId] || []).length;
    area.innerHTML = `<div style="display:flex;gap:10px;margin-bottom:10px"><button class="btn" id="tabWrite">写信</button><button class="btn" id="tabSent">写信箱 (${sentCount})</button><button class="btn" id="tabInbox">收件箱 (${inboxCount})</button><button class="btn" id="tabDrafts">草稿箱 (${draftCount})</button></div><div id="letterTabContent"></div>`;
    document.getElementById('tabWrite').onclick = () => switchTab(userId, 'write');
    document.getElementById('tabSent').onclick = () => switchTab(userId, 'sent');
    document.getElementById('tabInbox').onclick = () => switchTab(userId, 'inbox');
    document.getElementById('tabDrafts').onclick = () => switchTab(userId, 'drafts');
    switchTab(userId, 'write');
}

function switchTab(userId, tab) {
    const tabs = ['write', 'sent', 'inbox', 'drafts'];
    tabs.forEach(t => { const btn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1)); if (btn) btn.classList.remove('active'); });
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    if (tab !== 'write') { clearTimeout(draftAutoSaveTimer); autoSaveDraft(userId, true); }
    if (tab === 'write') renderWriteTab(userId);
    else if (tab === 'sent') renderSentTab(userId);
    else if (tab === 'inbox') renderInboxTab(userId);
    else if (tab === 'drafts') renderDraftsTab(userId);
    if (letterRefreshInterval) clearInterval(letterRefreshInterval);
    if (tab === 'sent') letterRefreshInterval = setInterval(() => renderSentTab(userId), 1000);
    updateLetterCounts(userId);
}

function updateLetterCounts(userId) {
    const sentCount = (appData.letters[userId] || []).filter(l => l.from === 'me').length;
    const inboxCount = (appData.letters[userId] || []).filter(l => l.from !== 'me').length;
    const draftCount = (appData.letterDrafts[userId] || []).length;
    const sentBtn = document.getElementById('tabSent'); if (sentBtn) sentBtn.innerText = `写信箱 (${sentCount})`;
    const inboxBtn = document.getElementById('tabInbox'); if (inboxBtn) inboxBtn.innerText = `收件箱 (${inboxCount})`;
    const draftsBtn = document.getElementById('tabDrafts'); if (draftsBtn) draftsBtn.innerText = `草稿箱 (${draftCount})`;
}

function fmtFullTime(isoStr) { const d = new Date(isoStr); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`; }

function autoSaveDraft(userId, force = false) {
    const body = document.getElementById('letterBody')?.value?.trim();
    if (!body) return;
    if (!appData.letterDrafts[userId]) appData.letterDrafts[userId] = [];
    const latestDraft = appData.letterDrafts[userId].slice(-1)[0];
    if (latestDraft && latestDraft.content === body) return;
    const draft = { id: 'L' + Date.now(), content: body, to: document.getElementById('letterTo')?.value?.trim() || '', sender: document.getElementById('letterFrom')?.value?.trim() || '', time: new Date().toISOString() };
    appData.letterDrafts[userId].push(draft);
    currentDraftId = null;
    markDataChanged(); save();
    updateLetterCounts(userId);
}

function renderWriteTab(userId) {
    const tab = document.getElementById('letterTabContent'); while (tab.firstChild) tab.removeChild(tab.firstChild);
    const target = getContact(userId);
    const container = document.createElement('div');
    container.innerHTML = `<div style="display:flex;gap:6px;align-items:center"><button class="btn" id="saveDraftBtn" style="display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('save')}</svg>保存草稿</button><button class="btn" id="undoBtn" style="display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('undo')}</svg></button><button class="btn" id="redoBtn" style="display:flex;align-items:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('redo')}</svg></button></div>
        <div>致：<input id="letterTo" value="${target.name}" style="width:70%;border-radius:8px;border:1px solid var(--border-light);padding:4px"><button class="btn" id="saveLetterTo">保存</button></div>
        <textarea id="letterBody" rows="5" placeholder="输入信件内容..."></textarea>
        <div>写信人：<input id="letterFrom" value="${appData.myProfile.name}" style="width:70%;border-radius:8px;border:1px solid var(--border-light);padding:4px"></div>
        <div>回信时间：<input id="letterReplyH" type="number" value="0" style="width:50px" min="0"> 时 <input id="letterReplyM" type="number" value="0" style="width:50px" min="0"> 分 <input id="letterReplyS" type="number" value="0" style="width:50px" min="0"> 秒 <button class="btn" id="saveLetterReplyTime">保存</button></div>
        <button class="btn-primary" id="sendLetterNow">发送</button>`;
    tab.appendChild(container);
    document.getElementById('saveDraftBtn').onclick = () => { autoSaveDraft(userId, true); toast('草稿已保存'); };
    document.getElementById('undoBtn').onclick = () => { if (letterUndoStack.length > 0) { const prev = letterUndoStack.pop(); document.getElementById('letterBody').value = prev; letterRedoStack.push(prev); if (letterRedoStack.length > 20) letterRedoStack.shift(); } };
    document.getElementById('redoBtn').onclick = () => { if (letterRedoStack.length > 0) { const next = letterRedoStack.pop(); document.getElementById('letterBody').value = next; letterUndoStack.push(next); if (letterUndoStack.length > 20) letterUndoStack.shift(); } };
    document.getElementById('saveLetterTo').onclick = () => { const n = document.getElementById('letterTo').value.trim(); if (n) { target.name = n; markDataChanged(); save(); updateAllNicknames(target); toast('称呼已更新'); } };
    document.getElementById('saveLetterReplyTime').onclick = () => { const h = parseInt(document.getElementById('letterReplyH').value) || 0; const m = parseInt(document.getElementById('letterReplyM').value) || 0; const s = parseInt(document.getElementById('letterReplyS').value) || 0; target.replyTime = h * 3600 + m * 60 + s; markDataChanged(); save(); toast('回复时间已保存'); };
    document.getElementById('sendLetterNow').onclick = () => {
        const to = document.getElementById('letterTo').value.trim();
        const body = document.getElementById('letterBody').value.trim();
        const from = document.getElementById('letterFrom').value.trim();
        const h = parseInt(document.getElementById('letterReplyH').value) || 0; const m = parseInt(document.getElementById('letterReplyM').value) || 0; const s = parseInt(document.getElementById('letterReplyS').value) || 0;
        const totalSeconds = h * 3600 + m * 60 + s;
        if (totalSeconds <= 0) { toast('请设置回信时间'); return; }
        if (!body) { toast('内容不能为空'); return; }
        if (!appData.letters[userId]) appData.letters[userId] = [];
        const cid = 'L' + Date.now();
        const deadline = new Date(Date.now() + totalSeconds * 1000).toISOString();
        appData.letters[userId].push({ cid, from: 'me', content: body, to, sender: from, time: new Date().toISOString(), replied: false, replyDeadline: deadline });
        currentDraftId = null;
        markDataChanged(); save();
        toast('信件已寄出');
        scheduleLetterReply(userId, totalSeconds);
        letterUndoStack = []; letterRedoStack = [];
        switchTab(userId, 'sent');
    };
    document.getElementById('letterBody').addEventListener('input', () => {
        letterUndoStack.push(document.getElementById('letterBody').value);
        if (letterUndoStack.length > 20) letterUndoStack.shift();
        clearTimeout(draftAutoSaveTimer);
        draftAutoSaveTimer = setTimeout(() => autoSaveDraft(userId), 500);
    });
    applyTransparency();
}

function renderSentTab(userId) {
    const tab = document.getElementById('letterTabContent'); while (tab.firstChild) tab.removeChild(tab.firstChild);
    const letters = (appData.letters[userId] || []).filter(l => l.from === 'me');
    if (!letters.length) { tab.textContent = '暂无信件'; return; }
    letters.slice().reverse().forEach((l, i) => {
        const div = document.createElement('div'); div.style.cssText = 'padding:8px;border-bottom:1px solid var(--border-light);font-size:13px !important;';
        const deadline = l.replyDeadline ? new Date(l.replyDeadline).getTime() : 0;
        const diff = deadline - Date.now();
        let countdown = '', starHtml = '';
        if (!l.replied && diff > 0) { const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000); countdown = `${h} 时 ${m} 分 ${s} 秒`; starHtml = '<span class="letter-star">🌟待回信</span>'; } else if (l.replied) { countdown = '已回信'; } else { countdown = '已过期'; }
        div.innerHTML = `<b>致 ${escapeHtml(l.to)}</b> ${starHtml} <span class="countdown">${countdown}</span><br><span style="color:var(--text-secondary);font-size:13px !important;">${fmtFullTime(l.time)}</span> <span style="color:var(--text-secondary);font-size:13px !important;">[${l.cid || ''}]</span><br><button class="btn" style="font-size:13px;" id="viewLetter${i}">查看</button>`;
        tab.appendChild(div);
        document.getElementById(`viewLetter${i}`).onclick = () => viewLetterContent(l.content);
    });
}
window.viewLetterContent = (content) => { showInputDialog('信件内容', '', () => {}); document.getElementById('inputDialogField').value = content; document.getElementById('inputDialogField').readOnly = true; };

function renderInboxTab(userId) {
    const tab = document.getElementById('letterTabContent'); while (tab.firstChild) tab.removeChild(tab.firstChild);
    const letters = (appData.letters[userId] || []).filter(l => l.from !== 'me');
    if (!letters.length) { tab.textContent = '暂无来信'; return; }
    letters.slice().reverse().forEach((l, i) => {
        const div = document.createElement('div'); div.style.cssText = 'padding:8px;border-bottom:1px solid var(--border-light);font-size:13px !important;';
        const short = l.content.length > 200 ? l.content.substring(0, 200) + '...' : l.content;
        div.innerHTML = `
            <b>${escapeHtml(l.sender || '梦角')} ${l.replyTo ? `(回复 ${l.replyTo})` : ''}</b> <span style="color:var(--text-secondary);font-size:13px !important;">${fmtFullTime(l.time)}</span> <span style="color:var(--text-secondary);font-size:13px !important;">[${l.cid || ''}]</span> ${!l.read ? '<span style="color:var(--theme);font-weight:bold;">● 未读</span>' : ''}<br>
            <div class="letter-collapse" id="letter-${userId}-${i}">${escapeHtml(short)}</div>
            ${l.content.length > 200 ? `<span class="letter-expand" id="toggleLetter${i}">展开</span>` : ''}
            <button class="btn" style="color:var(--theme); margin-top:4px;" id="viewInboxLetter${i}">查看</button>
            <button class="btn" style="color:#f44336; margin-top:4px;" id="deleteLetter${i}">删除</button>`;
        tab.appendChild(div);
        if (l.content.length > 200) {
            document.getElementById(`toggleLetter${i}`).onclick = () => { const el = document.getElementById(`letter-${userId}-${i}`); if (el.classList.contains('letter-collapse')) { el.textContent = l.content; el.classList.remove('letter-collapse'); document.getElementById(`toggleLetter${i}`).textContent = '收起'; } else { el.textContent = l.content.substring(0, 200) + '...'; el.classList.add('letter-collapse'); document.getElementById(`toggleLetter${i}`).textContent = '展开'; } };
        }
        document.getElementById(`viewInboxLetter${i}`).onclick = () => { markReplyAsRead(userId, l.cid); refreshReplyIndicators(); switchTab(userId, 'inbox'); viewLetterContent(l.content); };
        document.getElementById(`deleteLetter${i}`).onclick = () => { showConfirm('删除这封信？', () => { const lettersArr = appData.letters[userId].filter(l => l.from !== 'me'); lettersArr.splice(i, 1); appData.letters[userId] = appData.letters[userId].filter(l => l.from === 'me').concat(lettersArr); markDataChanged(); save(); switchTab(userId, 'inbox'); }); };
    });
}

function renderDraftsTab(userId) {
    const tab = document.getElementById('letterTabContent'); while (tab.firstChild) tab.removeChild(tab.firstChild);
    const drafts = appData.letterDrafts[userId] || [];
    if (drafts.length === 0) { tab.textContent = '暂无草稿'; return; }
    if (!draftUndoStacks[userId]) draftUndoStacks[userId] = {};
    if (!draftRedoStacks[userId]) draftRedoStacks[userId] = {};
    const header = document.createElement('div'); header.style.marginBottom = '8px';
    const selectAll = document.createElement('input'); selectAll.type = 'checkbox'; selectAll.id = 'draftSelectAll';
    const selectLabel = document.createElement('label'); selectLabel.appendChild(selectAll); selectLabel.appendChild(document.createTextNode(' 全选'));
    const batchDelBtn = document.createElement('button'); batchDelBtn.className = 'btn'; batchDelBtn.style.marginLeft = '10px'; batchDelBtn.textContent = '删除选中';
    header.appendChild(selectLabel); header.appendChild(batchDelBtn); tab.appendChild(header);
    selectAll.onchange = function() { document.querySelectorAll('.draft-checkbox').forEach(cb => cb.checked = this.checked); };
    batchDelBtn.onclick = () => { const ids = new Set(Array.from(document.querySelectorAll('.draft-checkbox:checked')).map(cb => cb.dataset.draftId)); if (ids.size === 0) { toast('请选择草稿'); return; } showConfirm(`删除 ${ids.size} 个草稿？`, () => { appData.letterDrafts[userId] = appData.letterDrafts[userId].filter(d => !ids.has(d.id)); markDataChanged(); save(); switchTab(userId, 'drafts'); }); };
    drafts.forEach((d, i) => {
        const draftId = d.id;
        if (!draftUndoStacks[userId][draftId]) draftUndoStacks[userId][draftId] = [];
        if (!draftRedoStacks[userId][draftId]) draftRedoStacks[userId][draftId] = [];
        const row = document.createElement('div'); row.style.cssText = 'padding:8px;border-bottom:1px solid var(--border-light);'; row.id = 'draft-' + draftId;
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'draft-checkbox'; cb.dataset.draftId = draftId;
        row.appendChild(cb); row.appendChild(document.createTextNode(' 草稿 ' + fmtFullTime(d.time)));
        row.appendChild(document.createElement('br'));
        const cidSpan = document.createElement('span'); cidSpan.style.fontSize = '10px'; cidSpan.style.color = 'var(--text-secondary)'; cidSpan.textContent = '编号: ' + (d.id || ''); row.appendChild(cidSpan);
        row.appendChild(document.createElement('br'));
        const contentDiv = document.createElement('div'); contentDiv.id = 'draft-content-' + draftId; contentDiv.textContent = d.content.substring(0, 50) + '...'; row.appendChild(contentDiv);
        const btnRow = document.createElement('div'); btnRow.style.cssText = 'display:flex;gap:6px;margin-top:4px';
        const editBtn = document.createElement('button'); editBtn.className = 'btn'; editBtn.textContent = '编辑'; editBtn.onclick = () => editDraftInline(userId, draftId);
        const sendBtn = document.createElement('button'); sendBtn.className = 'btn btn-primary'; sendBtn.textContent = '发送'; sendBtn.onclick = () => sendDraft(userId, draftId);
        const delBtn = document.createElement('button'); delBtn.className = 'btn'; delBtn.style.color = '#f44336'; delBtn.textContent = '删除'; delBtn.onclick = () => { showConfirm('删除这个草稿？', () => { appData.letterDrafts[userId] = appData.letterDrafts[userId].filter(d => d.id !== draftId); markDataChanged(); save(); switchTab(userId, 'drafts'); }); };
        btnRow.appendChild(editBtn); btnRow.appendChild(sendBtn); btnRow.appendChild(delBtn); row.appendChild(btnRow);
        tab.appendChild(row);
    });
}
window.editDraftInline = function(userId, draftId) {
    const drafts = appData.letterDrafts[userId]; const draft = drafts.find(d => d.id === draftId); if (!draft) return;
    draftUndoStacks[userId][draftId] = [draft.content]; draftRedoStacks[userId][draftId] = [];
    const container = document.getElementById(`draft-${draftId}`); while (container.firstChild) container.removeChild(container.firstChild);
    const textarea = document.createElement('textarea'); textarea.id = 'draftEditArea-' + draftId; textarea.rows = 4; textarea.style.cssText = 'width:100%;border-radius:8px;border:1px solid var(--border-light);padding:6px'; textarea.value = draft.content;
    container.appendChild(textarea);
    const btnRow = document.createElement('div'); btnRow.style.cssText = 'display:flex;gap:6px;margin-top:4px';
    const undoBtn = document.createElement('button'); undoBtn.className = 'btn'; undoBtn.style.display = 'flex'; undoBtn.style.alignItems = 'center';
    undoBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('undo')}</svg>`;
    undoBtn.onclick = () => { const stack = draftUndoStacks[userId][draftId]; if (!stack || stack.length === 0) return; const cur = textarea.value; const prev = stack.pop(); draftRedoStacks[userId][draftId].push(cur); if (draftRedoStacks[userId][draftId].length > 20) draftRedoStacks[userId][draftId].shift(); textarea.value = prev; };
    const redoBtn = document.createElement('button'); redoBtn.className = 'btn'; redoBtn.style.display = 'flex'; redoBtn.style.alignItems = 'center';
    redoBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('redo')}</svg>`;
    redoBtn.onclick = () => { const stack = draftRedoStacks[userId][draftId]; if (!stack || stack.length === 0) return; const cur = textarea.value; const next = stack.pop(); draftUndoStacks[userId][draftId].push(cur); if (draftUndoStacks[userId][draftId].length > 20) draftUndoStacks[userId][draftId].shift(); textarea.value = next; };
    const saveBtn = document.createElement('button'); saveBtn.className = 'btn'; saveBtn.textContent = '保存'; saveBtn.onclick = () => { const newContent = textarea.value.trim(); if (!newContent) { toast('内容不能为空'); return; } draft.content = newContent; draft.time = new Date().toISOString(); markDataChanged(); save(); toast('草稿已更新'); switchTab(userId, 'drafts'); };
    const cancelBtn = document.createElement('button'); cancelBtn.className = 'btn'; cancelBtn.textContent = '取消'; cancelBtn.onclick = () => { switchTab(userId, 'drafts'); };
    btnRow.appendChild(undoBtn); btnRow.appendChild(redoBtn); btnRow.appendChild(saveBtn); btnRow.appendChild(cancelBtn); container.appendChild(btnRow);
    let lastValue = textarea.value;
    textarea.addEventListener('input', () => { const cur = textarea.value; if (cur !== lastValue) { draftUndoStacks[userId][draftId].push(cur); if (draftUndoStacks[userId][draftId].length > 20) draftUndoStacks[userId][draftId].shift(); lastValue = cur; } });
};
window.sendDraft = (userId, draftId) => {
    const idx = appData.letterDrafts[userId].findIndex(d => d.id === draftId); if (idx === -1) return;
    const draft = appData.letterDrafts[userId].splice(idx, 1)[0];
    if (!appData.letters[userId]) appData.letters[userId] = [];
    const target = getContact(userId); let totalSeconds = target.replyTime || 86400;
    const replyH = parseInt(document.getElementById('letterReplyH')?.value) || 0; const replyM = parseInt(document.getElementById('letterReplyM')?.value) || 0; const replyS = parseInt(document.getElementById('letterReplyS')?.value) || 0;
    const customSecs = replyH * 3600 + replyM * 60 + replyS;
    if (customSecs > 0) totalSeconds = customSecs;
    else { showInputDialog('设置回信时间', '输入总秒数（默认86400=24小时）', (val) => { const secs = parseInt(val) || 86400; sendDraftInternal(userId, draft, secs); }); return; }
    sendDraftInternal(userId, draft, totalSeconds);
};
function sendDraftInternal(userId, draft, totalSeconds) {
    const deadline = new Date(Date.now() + totalSeconds * 1000).toISOString();
    appData.letters[userId].push({ cid: 'L' + Date.now(), from: 'me', content: draft.content, to: draft.to, sender: draft.sender, time: new Date().toISOString(), replied: false, replyDeadline: deadline });
    currentDraftId = null; markDataChanged(); save(); toast('草稿已发送');
    scheduleLetterReply(userId, totalSeconds); switchTab(userId, 'sent');
}

function scheduleLetterReply(userId, totalSeconds) {
    setTimeout(() => {
        const target = getContact(userId); if (!target) return;
        const pool = getCardPool(userId, false, true); let replyContent = '';
        const wordCount = 200 + Math.floor(Math.random() * 800);
        for (let i = 0; i < wordCount; i += (5 + Math.floor(Math.random() * 10))) { replyContent += pool[Math.floor(Math.random() * pool.length)]; if (Math.random() < 0.3) replyContent += SAFE_EMOJIS[Math.floor(Math.random() * SAFE_EMOJIS.length)]; }
        replyContent = sanitizeText(replyContent.trim().substring(0, 1000));
        if (!replyContent || replyContent.length < 1) replyContent = '嗯嗯';
        if (!appData.letters[userId]) appData.letters[userId] = [];
        const sent = appData.letters[userId].find(l => l.from === 'me' && !l.replied);
        if (sent) { sent.replied = true; appData.letters[userId].push({ cid: 'L' + Date.now(), from: 'user', content: replyContent, sender: target.name, time: new Date().toISOString(), replyTo: sent.cid, read: false }); }
        markDataChanged(); save(); refreshReplyIndicators();
        if (document.getElementById('letterPage').classList.contains('active') && currentChatId === userId) { updateLetterCounts(userId); switchTab(userId, 'inbox'); }
    }, totalSeconds * 1000);
}

// ========== 背景图库 ==========
function openMyBgPage() { document.getElementById('mePage').classList.remove('active'); document.getElementById('myBgPage').classList.add('active'); _contactBgUserId = 'me'; renderBgPageContent('me'); }
function openContactBgPage(userId) { document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('contactBgPage').classList.add('active'); _contactBgUserId = userId; renderBgPageContent(userId); }
function renderBgPageContent(userId) {
    const container = userId === 'me' ? document.getElementById('myBgPageContent') : document.getElementById('contactBgPageContent');
    while (container.firstChild) container.removeChild(container.firstChild);
    const user = getContact(userId); if (!user) return;
    const bgs = appData.userBgs[userId] || []; selectedBgIndex = bgs.indexOf(user.bg); selectedBgUserId = userId;
    const currentMomentsBg = appData.momentsBgs[userId] || '';
    const addBgBtn = document.createElement('button'); addBgBtn.className = 'btn'; addBgBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加背景'; addBgBtn.style.marginBottom = '10px';
    addBgBtn.onclick = () => { bgUploadTargetId = userId; document.getElementById('bgFileInput').click(); }; container.appendChild(addBgBtn);
    const galleryContainer = document.createElement('div'); galleryContainer.id = 'bgGalleryContainer'; galleryContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px';
    bgs.forEach((bg, i) => {
        const isChatBg = (bg === user.bg); const isMomentsBg = (bg === currentMomentsBg);
        let label = ''; if (isChatBg) label = '聊天'; if (isMomentsBg) label = label ? label + '·朋友圈' : '朋友圈';
        const div = document.createElement('div'); div.className = 'bg-thumb' + (i === selectedBgIndex ? ' selected' : '') + (isMomentsBg ? ' moments-selected' : ''); div.dataset.index = i;
        const img = document.createElement('img'); img.src = bg; img.onerror = () => { div.style.display = 'none'; }; div.appendChild(img);
        if (label) { const lbl = document.createElement('span'); lbl.className = 'bg-label'; lbl.textContent = label; div.appendChild(lbl); }
        const delBtn = document.createElement('span'); delBtn.className = 'bg-delete'; delBtn.textContent = '✕'; delBtn.onclick = (e) => { e.stopPropagation(); deleteBgInline(userId, i); }; div.appendChild(delBtn);
        div.onclick = () => { clickSelectBg(userId, i); updateBgLabels(userId); };
        div.ondblclick = () => { window.selectBg(userId, bg); if (userId === 'me') { document.getElementById('mePage').classList.add('active'); renderMePage(); } else { document.getElementById('contactDetailPage').classList.add('active'); renderContactDetail(userId); } document.getElementById(userId === 'me' ? 'myBgPage' : 'contactBgPage').classList.remove('active'); };
        galleryContainer.appendChild(div);
    });
    if (bgs.length === 0) galleryContainer.innerHTML = '<div style="font-size:12px;color:var(--text-secondary)">暂无背景图</div>'; container.appendChild(galleryContainer);
    const btnRow = document.createElement('div'); btnRow.style.cssText = 'display:flex;gap:6px;margin-top:8px';
    const applyChatBtn = document.createElement('button'); applyChatBtn.className = 'btn'; applyChatBtn.id = 'applyChatBgBtn'; applyChatBtn.style.cssText = 'display:flex;align-items:center;';
    applyChatBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('check')}</svg>应用选中的聊天背景`;
    applyChatBtn.onclick = () => { if (selectedBgIndex >= 0 && selectedBgUserId === userId && bgs[selectedBgIndex]) { window.selectBg(userId, bgs[selectedBgIndex]); highlightBgButton('chat'); } else toast('请先点击选择一张背景图'); };
    const applyMomentsBtn = document.createElement('button'); applyMomentsBtn.className = 'btn'; applyMomentsBtn.id = 'applyMomentsBgBtn'; applyMomentsBtn.style.cssText = 'display:flex;align-items:center;';
    applyMomentsBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('sun')}</svg>设为朋友圈背景`;
    applyMomentsBtn.onclick = () => { if (selectedBgIndex >= 0 && selectedBgUserId === userId && bgs[selectedBgIndex]) { setMomentsBgFromGallery(userId, bgs[selectedBgIndex]); highlightBgButton('moments'); } else toast('请先点击选择一张背景图'); };
    btnRow.appendChild(applyChatBtn); btnRow.appendChild(applyMomentsBtn); container.appendChild(btnRow); highlightBgButton(null);
}
function highlightBgButton(type) { const chatBtn = document.getElementById('applyChatBgBtn'); const momentsBtn = document.getElementById('applyMomentsBgBtn'); if (chatBtn) { chatBtn.classList.toggle('btn-highlight', type === 'chat'); } if (momentsBtn) { momentsBtn.classList.toggle('btn-highlight', type === 'moments'); } }
function setMomentsBgFromGallery(userId, bg) { if (appData.momentsBgs[userId] === bg) { toast('该背景已在使用'); return; } appData.momentsBgs[userId] = bg; if (!appData.userBgs[userId]) appData.userBgs[userId] = []; if (!appData.userBgs[userId].includes(bg)) appData.userBgs[userId].push(bg); markDataChanged(); save(); if (currentMomentUserId === userId && document.getElementById('momentsPage').classList.contains('active')) { document.getElementById('momentsListContainer').style.backgroundImage = `url(${bg})`; } updateBgLabels(userId); toast('朋友圈背景已更新'); }
function updateBgLabels(userId) { const container = document.getElementById('bgGalleryContainer'); if (!container) return; const user = getContact(userId); if (!user) return; const bgs = appData.userBgs[userId] || []; const currentMomentsBg = appData.momentsBgs[userId] || ''; const thumbs = container.querySelectorAll('.bg-thumb'); thumbs.forEach((thumb, i) => { const bg = bgs[i]; if (!bg) return; const isChatBg = (bg === user.bg); const isMomentsBg = (bg === currentMomentsBg); let label = ''; if (isChatBg) label = '聊天'; if (isMomentsBg) label = label ? label + '·朋友圈' : '朋友圈'; let lbl = thumb.querySelector('.bg-label'); if (label) { if (!lbl) { lbl = document.createElement('span'); lbl.className = 'bg-label'; thumb.appendChild(lbl); } lbl.textContent = label; } else { if (lbl) lbl.remove(); } thumb.classList.toggle('moments-selected', isMomentsBg); if (i === selectedBgIndex) thumb.classList.add('selected'); else thumb.classList.remove('selected'); }); }
window.clickSelectBg = function(userId, index) { selectedBgIndex = index; selectedBgUserId = userId; const container = document.getElementById('bgGalleryContainer'); if (container) container.querySelectorAll('.bg-thumb').forEach((thumb, i) => thumb.classList.toggle('selected', i === index)); };
window.applyBg = function(userId, index) { const bgs = appData.userBgs[userId] || []; if (bgs[index]) { window.selectBg(userId, bgs[index]); const mask = document.querySelector('.mask.show'); if (mask) mask.remove(); } };
window.selectBg = (userId, bg) => { const user = getContact(userId); if (!user) return; if (user.bg === bg) { toast('该背景已在使用'); return; } user.bg = bg; markDataChanged(); save(); if (currentChatId === userId) { document.getElementById('chatMessages').style.backgroundImage = `url(${bg})`; document.getElementById('chatMessages').style.backgroundSize = 'cover'; document.getElementById('chatMessages').style.backgroundRepeat = 'no-repeat'; document.getElementById('chatMessages').style.backgroundPosition = 'center'; } updateBgLabels(userId); toast('背景已更换'); };
function deleteBgInline(userId, index) { showConfirm('删除这张背景图？', () => { const bgs = appData.userBgs[userId] || []; bgs.splice(index, 1); if (selectedBgIndex === index) selectedBgIndex = -1; else if (selectedBgIndex > index) selectedBgIndex--; markDataChanged(); save(); renderBgPageContent(userId); }); }

function deleteContact(userId) { showConfirm('确定删除该联系人及其所有数据？', () => { appData.users = appData.users.filter(u => u.id !== userId); delete appData.msg[userId]; delete appData.userEmo[userId]; delete appData.userImages[userId]; delete appData.userBgs[userId]; delete appData.letters[userId]; delete appData.letterDrafts[userId]; delete appData.moments[userId]; delete appData.momentsBgs[userId]; delete appData.userVoices[userId]; markDataChanged(); save(); if (currentChatId === userId) currentChatId = null; renderChatList(); renderContactList(); document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('contactsPage').classList.add('active'); document.getElementById('globalMask').classList.remove('show'); toast('联系人已删除'); }); }

window.setMomentsBg = function(userId) { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = async function(e) { const f = e.target.files[0]; if (!f) return; try { const b64 = await processImage(f, 500); if (appData.momentsBgs[userId] === b64) { toast('背景已使用，无需重复设置'); return; } appData.momentsBgs[userId] = b64; if (!appData.userBgs[userId]) appData.userBgs[userId] = []; if (!appData.userBgs[userId].includes(b64)) appData.userBgs[userId].push(b64); markDataChanged(); setTimeout(() => save(), 100); if (currentMomentUserId === userId && document.getElementById('momentsPage').classList.contains('active')) { document.getElementById('momentsListContainer').style.backgroundImage = `url(${b64})`; } toast('朋友圈背景已更新并保存到图库'); } catch { toast('朋友圈背景更新失败，请换张图片'); } }; input.click(); };

// ========== 表情管理独立页面 ==========
function openEmojiManagerPage() { document.getElementById('chatsPage').classList.remove('active'); document.getElementById('mePage').classList.remove('active'); document.getElementById('emojiManagerPage').classList.add('active'); renderEmojiManagerContent(); }
function renderEmojiManagerContent() { const body = document.getElementById('emojiManagerPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const addRow = document.createElement('div'); const addBtn = document.createElement('button'); addBtn.className = 'btn'; addBtn.style.cssText = 'display:flex;align-items:center;'; addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('plus')}</svg>添加`; addBtn.onclick = () => document.getElementById('globalEmojiFile').click(); const countSpan = document.createElement('span'); countSpan.style.cssText = 'margin-left:8px;font-size:12px;color:var(--text-secondary)'; countSpan.textContent = `(${appData.globalEmojis.length})`; addRow.appendChild(addBtn); addRow.appendChild(countSpan); body.appendChild(addRow); const list = document.createElement('div'); list.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px'; appData.globalEmojis.forEach((e, i) => { const container = document.createElement('div'); container.style.position = 'relative'; const img = document.createElement('img'); img.src = e; img.style.cssText = 'width:50px;height:50px;object-fit:cover;border-radius:8px;'; const del = document.createElement('span'); del.style.cssText = 'position:absolute;top:-5px;right:-5px;cursor:pointer;color:red'; del.textContent = '✕'; del.onclick = () => window.deleteGlobalEmoji(i); container.appendChild(img); container.appendChild(del); list.appendChild(container); }); if (!appData.globalEmojis.length) list.textContent = '暂无'; body.appendChild(list); }
window.deleteGlobalEmoji = function(index) { showConfirm('删除此全局表情？', () => { appData.globalEmojis.splice(index, 1); markDataChanged(); save(); renderEmojiManagerContent(); if (currentChatId) renderEmojiPanel(); }); };

// ========== 屏蔽词管理独立页面 ==========
function openBlockedPage() { document.getElementById('chatsPage').classList.remove('active'); document.getElementById('mePage').classList.remove('active'); document.getElementById('blockedPage').classList.add('active'); const body = document.getElementById('blockedPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const inputRow = document.createElement('div'); inputRow.style.cssText = 'display:flex;gap:6px'; const kwInput = document.createElement('input'); kwInput.id = 'newBlockedKw'; kwInput.placeholder = '添加屏蔽词'; kwInput.style.cssText = 'flex:1;border-radius:14px;border:1px solid var(--border-light);padding:6px'; const addBtn = document.createElement('button'); addBtn.className = 'btn btn-primary'; addBtn.textContent = '添加'; addBtn.onclick = () => { const val = kwInput.value.trim(); if (val && addBlockedKeyword(val)) { kwInput.value = ''; renderBlockedList(); toast('屏蔽词已添加'); } }; inputRow.appendChild(kwInput); inputRow.appendChild(addBtn); body.appendChild(inputRow); const batchRow = document.createElement('div'); batchRow.style.cssText = 'display:flex;gap:6px'; const batchBtn = document.createElement('button'); batchBtn.className = 'btn'; batchBtn.style.cssText = 'display:flex;align-items:center;'; batchBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('clipboard')}</svg>批量导入`; batchBtn.onclick = () => { showInputDialogRaw('批量导入屏蔽词', '每行一个屏蔽词', (text) => { if (text) batchImportBlockedKeywords(text); renderBlockedList(); }); }; batchRow.appendChild(batchBtn); body.appendChild(batchRow); const listContainer = document.createElement('div'); listContainer.id = 'blockedList'; listContainer.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:8px'; body.appendChild(listContainer); const note = document.createElement('div'); note.style.cssText = 'font-size:12px;color:var(--text-secondary)'; note.textContent = '导入字卡时，含屏蔽词的条目会被自动禁用。'; body.appendChild(note); const renderBlockedList = () => { while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild); appData.blockedKeywords.forEach(kw => { const tag = document.createElement('span'); tag.className = 'blocked-keyword-tag'; const text = document.createElement('span'); text.textContent = kw; const del = document.createElement('span'); del.className = 'remove-kw'; del.textContent = '✕'; del.onclick = () => { if (removeBlockedKeyword(kw)) { renderBlockedList(); toast('已移除屏蔽词'); } }; tag.appendChild(text); tag.appendChild(del); listContainer.appendChild(tag); }); if (!appData.blockedKeywords.length) listContainer.innerHTML = '<span style="font-size:12px;color:var(--text-secondary)">暂无屏蔽词</span>'; }; renderBlockedList(); }

// ========== 联系人备份/导出 ==========
async function exportContactData(userId) {
    const u = getContact(userId); if (!u) return;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`;

    // 聊天记录里内联语音和图片
    const rawChat = JSON.parse(JSON.stringify(appData.msg[userId] || []));
    for (const msg of rawChat) {
        if (msg.image && typeof msg.image === 'string' && msg.image.startsWith('img_')) {
            try { const b64 = await loadMedia(msg.image); if (b64) msg.image = b64; } catch (e) {}
        }
        if (msg.voice && typeof msg.voice === 'string' && msg.voice.startsWith('voice_')) {
            try { const b64 = await loadMedia(msg.voice); if (b64) msg.voice = b64; } catch (e) {}
        }
    }

    // ★ voices 处理：和 exportUserVoices 完全一致
    const rawVoices = (appData.userVoices[userId] || []).map(v => ({ name: v.name, data: v.data }));
    const cleanVoices = JSON.parse(JSON.stringify(rawVoices));

    const data = {
        id: u.id, name: u.name, avt: u.avt, bg: u.bg, status: u.status,
        noReply: u.noReply, noDisturb: u.noDisturb, allowInitiative: u.allowInitiative,
        soundEnabled: u.soundEnabled, replyTime: u.replyTime, rule: u.rule,
        combineMin: u.combineMin, combineMax: u.combineMax, muted: u.muted,
        hideReplyIndicator: u.hideReplyIndicator,
        cardGroups: u.cardGroups,
        emojis: appData.userEmo[userId] || [],
        images: appData.userImages[userId] || [],
        bgs: appData.userBgs[userId] || [],
        chat: rawChat,
        moments: appData.moments[userId] || [],
        letters: (appData.letters[userId] || []).filter(l => l.from === 'me'),
        receivedLetters: (appData.letters[userId] || []).filter(l => l.from !== 'me'),
        drafts: appData.letterDrafts[userId] || [],
        momentsBg: appData.momentsBgs[userId] || '',
        voices: cleanVoices
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Mo_contact_${u.name}_${dateStr}_${timeStr}.json`; a.click(); URL.revokeObjectURL(a.href);
    toast('联系人数据已备份');
}
document.getElementById('contactRestoreInput').onchange = function(e) { const file = e.target.files[0]; if (!file) return; const fileInput = this; const reader = new FileReader(); reader.onload = function(ev) { try { const text = ev.target.result; if (file.name.endsWith('.json')) { try { const json = JSON.parse(text); if (json.name && (json.cardGroups || json.emojis || json.chat || json.letters)) { const targetId = fileInput._contactId || currentChatId; showImportModeDialog((mode) => { importContactData(targetId, json, mode); }); return; } } catch (jsonErr) {} } const result = parseFileContent(text, file.name); if (result.parseError) { toast('文件格式错误，无法解析'); return; } if (result.noValidData || (result.cards.length === 0 && result.groups.length === 0)) { toast('未找到有效数据'); return; } showImportModeDialog((mode) => { importContactData(currentChatId, { customReplyGroups: result.groups }, mode); }); } catch { toast('文件损坏，导入失败'); } }; reader.readAsText(file); e.target.value = ''; };

function showImportModeDialog(callback) { const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '导入模式'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; const mergeBtn = document.createElement('button'); mergeBtn.className = 'btn-primary'; mergeBtn.textContent = '追加合并'; mergeBtn.onclick = () => { overlay.remove(); callback('merge'); }; const overwriteBtn = document.createElement('button'); overwriteBtn.className = 'btn'; overwriteBtn.style.cssText = 'background:#f44336;color:white'; overwriteBtn.textContent = '覆盖当前数据'; overwriteBtn.onclick = () => { overlay.remove(); callback('overwrite'); }; body.appendChild(mergeBtn); body.appendChild(overwriteBtn); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }


function importContactData(userId, data, mode) {
    const u = getContact(userId); if (!u) return;
    if (data.customReplyGroups && Array.isArray(data.customReplyGroups)) {
        const groups = data.customReplyGroups.filter(g => g.name && g.list);
        if (groups.length > 0) {
            if (mode === 'overwrite') { u.cardGroups = groups.map(g => ({ name: g.name, list: g.list })); }
            else { groups.forEach(g => { const existing = u.cardGroups.find(eg => eg.name === g.name); if (existing) existing.list = uniqueArr([...existing.list, ...g.list]); else u.cardGroups.push({ name: g.name, list: g.list }); }); }
            markDataChanged(); save(); toast(`识别到 milk 格式，导入 ${groups.length} 个分组`); return;
        }
    }
    if (mode === 'overwrite') {
        if (data.name) u.name = data.name;
        if (data.avt !== undefined) u.avt = data.avt;
        if (data.bg !== undefined) u.bg = data.bg;
        if (data.status) u.status = data.status;
        u.noReply = !!data.noReply; u.noDisturb = !!data.noDisturb;
        u.allowInitiative = data.allowInitiative !== undefined ? data.allowInitiative : true;
        u.soundEnabled = data.soundEnabled !== undefined ? data.soundEnabled : true;
        if (data.replyTime) u.replyTime = data.replyTime;
        if (data.rule) u.rule = data.rule;
        if (data.cardGroups) u.cardGroups = data.cardGroups;
        if (data.combineMin !== undefined) u.combineMin = data.combineMin;
        if (data.combineMax !== undefined) u.combineMax = data.combineMax;
        if (data.muted !== undefined) u.muted = data.muted;
        if (data.hideReplyIndicator !== undefined) u.hideReplyIndicator = data.hideReplyIndicator;
        appData.userEmo[userId] = data.emojis || [];
        appData.userImages[userId] = data.images || [];
        appData.userBgs[userId] = data.bgs || [];
        appData.msg[userId] = data.chat || [];
        if (data.moments) appData.moments[userId] = data.moments;
        if (data.momentsBg !== undefined) appData.momentsBgs[userId] = data.momentsBg;
        appData.letters[userId] = [...(data.letters || []), ...(data.receivedLetters || [])];
        appData.letterDrafts[userId] = data.drafts || [];
        // ★ 这里改了
        if (data.voices && Array.isArray(data.voices)) {
            appData.userVoices[userId] = [];
            data.voices.forEach(v => { if (v.name && v.data) appData.userVoices[userId].push({ name: v.name, data: v.data }); });
        }
    } else {
        if (!u.name && data.name) u.name = data.name;
        if (!u.avt && data.avt) u.avt = data.avt;
        if (!u.bg && data.bg) u.bg = data.bg;
        if (!u.status && data.status) u.status = data.status;
        u.rule = data.rule || u.rule;
        if (data.cardGroups) { data.cardGroups.forEach(g => { const existing = u.cardGroups.find(eg => eg.name === g.name); if (existing) existing.list = uniqueArr([...existing.list, ...g.list]); else u.cardGroups.push({ name: g.name, list: g.list }); }); }
        if (data.emojis) appData.userEmo[userId] = uniqueArr([...(appData.userEmo[userId] || []), ...data.emojis]);
        if (data.images) appData.userImages[userId] = uniqueArr([...(appData.userImages[userId] || []), ...data.images]);
        if (data.bgs) appData.userBgs[userId] = uniqueArr([...(appData.userBgs[userId] || []), ...data.bgs]);
        if (data.chat) { if (!appData.msg[userId]) appData.msg[userId] = []; const existingKeys = new Set(appData.msg[userId].map(m => getMsgKey(m))); data.chat.forEach(m => { if (!existingKeys.has(getMsgKey(m))) appData.msg[userId].push(m); }); }
        if (data.moments) { if (!appData.moments[userId]) appData.moments[userId] = []; const em = new Set(appData.moments[userId].map(m => m.time)); data.moments.forEach(m => { if (!em.has(m.time)) appData.moments[userId].push(m); }); }
        if (data.momentsBg && !appData.momentsBgs[userId]) appData.momentsBgs[userId] = data.momentsBg;
        if (data.letters || data.receivedLetters) { if (!appData.letters[userId]) appData.letters[userId] = []; const ec = new Set(appData.letters[userId].map(l => l.cid)); [...(data.letters || []), ...(data.receivedLetters || [])].forEach(l => { if (!ec.has(l.cid)) appData.letters[userId].push(l); }); }
        if (data.drafts) { if (!appData.letterDrafts[userId]) appData.letterDrafts[userId] = []; const ed = new Set(appData.letterDrafts[userId].map(d => d.id)); data.drafts.forEach(d => { if (!ed.has(d.id)) appData.letterDrafts[userId].push(d); }); }
        if (data.voices && Array.isArray(data.voices)) { if (!appData.userVoices[userId]) appData.userVoices[userId] = []; data.voices.forEach(v => { if (v.name && v.data && !appData.userVoices[userId].some(vv => vv.name === v.name && vv.data === v.data)) { appData.userVoices[userId].push({ name: v.name, data: v.data }); } }); }
    }
    markDataChanged(); save(); toast('导入成功');
}

// ========== 搜索聊天内容 ==========
function openSearchPage() { document.getElementById('chatsPage').classList.remove('active'); document.getElementById('chatPage').classList.remove('active'); document.getElementById('contactsPage').classList.remove('active'); document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('discoverPage').classList.remove('active'); document.getElementById('momentsPage').classList.remove('active'); document.getElementById('mePage').classList.remove('active'); document.getElementById('searchPage').classList.add('active'); const body = document.getElementById('searchPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const searchRow = document.createElement('div'); searchRow.className = 'search-row'; searchRow.style.marginBottom = '10px'; const kwInput = document.createElement('input'); kwInput.id = 'searchKw'; kwInput.placeholder = '输入关键词搜索聊天内容...'; kwInput.style.cssText = 'flex:1;padding:8px 12px;border-radius:15px;border:1px solid var(--border-light);font-size:14px;'; const searchBtn = document.createElement('button'); searchBtn.className = 'btn-primary'; searchBtn.textContent = '搜索'; searchRow.appendChild(kwInput); searchRow.appendChild(searchBtn); body.appendChild(searchRow); if (currentChatId === 'me') { const scopeRow = document.createElement('div'); scopeRow.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;justify-content:center;'; const allBtn = document.createElement('button'); allBtn.className = 'btn'; allBtn.textContent = '全部'; allBtn.dataset.scope = 'all'; const meBtn = document.createElement('button'); meBtn.className = 'btn'; meBtn.textContent = '仅我的消息'; meBtn.dataset.scope = 'me'; const mjBtn = document.createElement('button'); mjBtn.className = 'btn'; mjBtn.textContent = '仅mj的消息'; mjBtn.dataset.scope = 'mj'; allBtn.classList.add('active'); scopeRow.appendChild(allBtn); scopeRow.appendChild(meBtn); scopeRow.appendChild(mjBtn); body.appendChild(scopeRow); window._searchScope = 'all'; scopeRow.querySelectorAll('button').forEach(btn => { btn.onclick = () => { scopeRow.querySelectorAll('button').forEach(b => b.classList.remove('active')); btn.classList.add('active'); window._searchScope = btn.dataset.scope || 'all'; doSearch(); }; }); } const extraRow = document.createElement('div'); extraRow.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;'; const dateSearchBtn = document.createElement('button'); dateSearchBtn.className = 'btn'; dateSearchBtn.style.cssText = 'display:flex;align-items:center;'; dateSearchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('calendar')}</svg>按日期查找`; dateSearchBtn.onclick = () => { openDateSearchPage(); }; const imageSearchBtn = document.createElement('button'); imageSearchBtn.className = 'btn'; imageSearchBtn.style.cssText = 'display:flex;align-items:center;'; imageSearchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('image')}</svg>按图片查找`; imageSearchBtn.onclick = () => { openImageSearchPage(); }; const voiceSearchBtn = document.createElement('button'); voiceSearchBtn.className = 'btn'; voiceSearchBtn.style.cssText = 'display:flex;align-items:center;'; voiceSearchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('mic')}</svg>按语音查找`; voiceSearchBtn.onclick = () => { openVoiceSearchPage(); }; const musicSearchBtn = document.createElement('button'); musicSearchBtn.className = 'btn'; musicSearchBtn.style.cssText = 'display:flex;align-items:center;'; musicSearchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('music')}</svg>按音乐查找`; musicSearchBtn.onclick = () => { openMusicSearchPage(); }; const bookSearchBtn = document.createElement('button'); bookSearchBtn.className = 'btn'; bookSearchBtn.style.cssText = 'display:flex;align-items:center;'; bookSearchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('book-open')}</svg>按书籍查找`; bookSearchBtn.onclick = () => { openBookSearchPage(); }; const movieSearchBtn = document.createElement('button'); movieSearchBtn.className = 'btn'; movieSearchBtn.style.cssText = 'display:flex;align-items:center;'; movieSearchBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;">${getIconSVG('film')}</svg>按电影查找`; movieSearchBtn.onclick = () => { openMovieSearchPage(); }; extraRow.appendChild(dateSearchBtn); extraRow.appendChild(imageSearchBtn); extraRow.appendChild(voiceSearchBtn); extraRow.appendChild(musicSearchBtn); extraRow.appendChild(bookSearchBtn); extraRow.appendChild(movieSearchBtn); body.appendChild(extraRow); const resultsContainer = document.createElement('div'); resultsContainer.id = 'searchResults'; resultsContainer.style.cssText = 'flex:1;overflow-y:auto;'; body.appendChild(resultsContainer); const doSearch = () => { const kw = kwInput.value.trim().toLowerCase(); while (resultsContainer.firstChild) resultsContainer.removeChild(resultsContainer.firstChild); if (!kw) { resultsContainer.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px">输入关键词搜索</div>'; return; } const allMsgs = []; if (currentChatId === 'me') { for (const chatId in appData.msg) { const msgs = appData.msg[chatId] || []; const contact = getContact(chatId); const contactName = contact ? contact.name : chatId; msgs.forEach(m => { const scope = window._searchScope || 'all'; const isMyMsg = (m.me === true || m.senderId === 'me'); if (scope === 'me' && !isMyMsg) return; if (scope === 'mj' && isMyMsg) return; let match = false; if (m.text && m.text.toLowerCase().includes(kw)) match = true; else if (m.quote && m.quote.text && m.quote.text.toLowerCase().includes(kw)) match = true; else if (m.voiceNote && m.voiceNote.toLowerCase().includes(kw)) match = true; else if (m.voice && m.voiceDuration && String(m.voiceDuration).includes(kw)) match = true; else if (m.text && (m.text.startsWith('🎵') || m.text.startsWith('🎶') || m.text.startsWith('📖') || m.text.startsWith('🎬') || m.text.startsWith('🌟'))) { const shareContent = m.text.replace(/^[🎵🎶📖🎬🌟]\s*.+?\s*(分享了|分享了一首歌|分享了一本书|分享了一部电影)/, '').toLowerCase(); if (shareContent.includes(kw)) match = true; } if (match) allMsgs.push({ ...m, chatId, chatName: contactName }); }); } } else if (currentChatId) { const msgs = appData.msg[currentChatId] || []; msgs.forEach(m => { let match = false; if (m.text && m.text.toLowerCase().includes(kw)) match = true; else if (m.quote && m.quote.text && m.quote.text.toLowerCase().includes(kw)) match = true; else if (m.voiceNote && m.voiceNote.toLowerCase().includes(kw)) match = true; else if (m.voice && m.voiceDuration && String(m.voiceDuration).includes(kw)) match = true; else if (m.text && (m.text.startsWith('🎵') || m.text.startsWith('🎶') || m.text.startsWith('📖') || m.text.startsWith('🎬') || m.text.startsWith('🌟'))) { const shareContent = m.text.replace(/^[🎵🎶📖🎬🌟]\s*.+?\s*(分享了|分享了一首歌|分享了一本书|分享了一部电影)/, '').toLowerCase(); if (shareContent.includes(kw)) match = true; } if (match) allMsgs.push({ ...m, chatId: currentChatId }); }); } allMsgs.sort((a, b) => new Date(b.time) - new Date(a.time)); if (!allMsgs.length) { resultsContainer.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px">无结果</div>'; return; } allMsgs.forEach(m => { const contact = getContact(m.chatId); const contactName = contact ? contact.name : m.chatId; const div = document.createElement('div'); div.style.cssText = 'padding:10px;border-bottom:1px solid var(--border-light);cursor:pointer'; const header = document.createElement('div'); header.style.cssText = 'font-weight:bold;font-size:13px;color:var(--theme)'; header.textContent = (m.me ? '我' : m.senderName || contactName) + ' · ' + contactName; const content = document.createElement('div'); content.style.cssText = 'font-size:14px;margin:4px 0'; content.textContent = m.text || (m.voice ? '[语音]' : '[图片]') || ''; if (m.voiceNote) { const noteDiv = document.createElement('div'); noteDiv.style.cssText = 'font-size:11px;color:var(--text-secondary);font-style:italic;'; noteDiv.textContent = '备注: ' + m.voiceNote; content.appendChild(noteDiv); } if (m.quote) { const qDiv = document.createElement('div'); qDiv.style.cssText = 'font-size:12px;color:var(--text-secondary);background:rgba(0,0,0,0.03);padding:2px 6px;border-radius:6px;margin-top:2px'; qDiv.textContent = '引用: ' + (m.quote.text || '[图片]'); div.appendChild(qDiv); } const time = document.createElement('div'); time.style.fontSize = '11px'; time.style.color = 'var(--text-secondary)'; time.textContent = new Date(m.time).toLocaleString(); div.appendChild(header); div.appendChild(content); div.appendChild(time); div.onclick = () => { document.getElementById('searchPage').classList.remove('active'); currentChatId = m.chatId; openChat(); setTimeout(() => { const msgEl = document.querySelector(`.msg-row[data-msg-time="${m.time}"]`); if (msgEl) { msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); msgEl.style.backgroundColor = 'rgba(197,164,126,0.2)'; setTimeout(() => msgEl.style.backgroundColor = '', 1500); } if (m.text && (m.text.startsWith('🎵') || m.text.startsWith('🌟') || m.text.startsWith('🎶'))) { const songTitle = m.text.replace(/🎵 分享了一首歌《(.+?)》.*/, '$1').replace(/🌟 .+ 分享了《(.+?)》.*/, '$1').replace(/🎶 .+ 分享了一首歌《(.+?)》.*/, '$1'); const pl = appData.musicPlaylists[0]; if (pl) { const idx = pl.songs.findIndex(s => s.title === songTitle); if (idx >= 0) { musicCurrentPlaylistIndex = 0; musicCurrentSongIndex = idx; musicPlayIndex(idx); } } } }, 100); }; resultsContainer.appendChild(div); }); }; searchBtn.onclick = doSearch; kwInput.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); }); }

// ========== 按书籍查找 ==========
function openBookSearchPage() { document.getElementById('searchPage').classList.remove('active'); document.getElementById('bookSearchPage').classList.add('active'); renderBookSearch(); }
function renderBookSearch() { const container = document.getElementById('bookSearchPageContent'); while (container.firstChild) container.removeChild(container.firstChild); const list = document.createElement('div'); list.className = 'music-search-list'; const allBooks = []; const bookSearchTargets = (currentChatId && currentChatId !== 'me') ? { [currentChatId]: appData.msg[currentChatId] || [] } : appData.msg; for (const chatId in bookSearchTargets) { (bookSearchTargets[chatId] || []).forEach(m => { if ((m.text && m.text.startsWith('📖 分享了一本书')) || (m.type === 'share' && m.text && m.text.startsWith('📖'))) allBooks.push({ ...m, chatId }); }); } allBooks.sort((a, b) => new Date(b.time) - new Date(a.time)); if (!allBooks.length) { container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px">暂无分享的书籍</div>'; return; } allBooks.forEach(m => { const item = document.createElement('div'); item.className = 'music-search-item'; const displayName = m.senderId === 'me' ? appData.myProfile.name : (m.senderName || ''); item.innerHTML = `<span class="music-icon">📖</span><div class="music-info"><div><b>${escapeHtml(displayName)}</b></div><div>${escapeHtml(m.text)}</div><div style="font-size:11px;color:var(--text-secondary)">${new Date(m.time).toLocaleString()}</div></div>`; item.onclick = () => { document.getElementById('bookSearchPage').classList.remove('active'); currentChatId = m.chatId; openChat(); setTimeout(() => { const msgEl = document.querySelector(`[data-msg-time="${m.time}"]`); if (msgEl) { msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); msgEl.style.backgroundColor = 'rgba(197,164,126,0.2)'; setTimeout(() => msgEl.style.backgroundColor = '', 1500); } }, 100); }; list.appendChild(item); }); container.appendChild(list); }

// ========== 按电影查找 ==========
function openMovieSearchPage() { document.getElementById('searchPage').classList.remove('active'); document.getElementById('movieSearchPage').classList.add('active'); renderMovieSearchPage(); }
function renderMovieSearchPage() { const container = document.getElementById('movieSearchPageContent'); while (container.firstChild) container.removeChild(container.firstChild); const list = document.createElement('div'); list.className = 'music-search-list'; const allMovies = []; const movieSearchTargets = (currentChatId && currentChatId !== 'me') ? { [currentChatId]: appData.msg[currentChatId] || [] } : appData.msg; for (const chatId in movieSearchTargets) { (movieSearchTargets[chatId] || []).forEach(m => { if ((m.text && m.text.startsWith('🎬 分享了一部电影')) || (m.type === 'share' && m.text && m.text.startsWith('🎬'))) allMovies.push({ ...m, chatId }); }); } allMovies.sort((a, b) => new Date(b.time) - new Date(a.time)); if (!allMovies.length) { container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px">暂无分享的电影</div>'; return; } allMovies.forEach(m => { const item = document.createElement('div'); item.className = 'music-search-item'; const displayName = m.senderId === 'me' ? appData.myProfile.name : (m.senderName || ''); item.innerHTML = `<span class="music-icon">🎬</span><div class="music-info"><div><b>${escapeHtml(displayName)}</b></div><div>${escapeHtml(m.text)}</div><div style="font-size:11px;color:var(--text-secondary)">${new Date(m.time).toLocaleString()}</div></div>`; item.onclick = () => { document.getElementById('movieSearchPage').classList.remove('active'); currentChatId = m.chatId; openChat(); setTimeout(() => { const msgEl = document.querySelector(`[data-msg-time="${m.time}"]`); if (msgEl) { msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); msgEl.style.backgroundColor = 'rgba(197,164,126,0.2)'; setTimeout(() => msgEl.style.backgroundColor = '', 1500); } }, 100); }; list.appendChild(item); }); container.appendChild(list); }

// ========== 日期搜索、图片搜索、语音搜索、音乐搜索 ==========
function openDateSearchPage() { document.getElementById('searchPage').classList.remove('active'); document.getElementById('dateSearchPage').classList.add('active'); renderDateSearch(); }
function renderDateSearch(year, month) { const now = new Date(); if (!year) year = now.getFullYear(); if (!month) month = now.getMonth() + 1; const container = document.getElementById('dateSearchPageContent'); while (container.firstChild) container.removeChild(container.firstChild); const calDiv = document.createElement('div'); calDiv.className = 'date-calendar'; const calHeader = document.createElement('div'); calHeader.className = 'cal-header'; const prevBtn = document.createElement('button'); prevBtn.textContent = '‹'; prevBtn.onclick = () => { const m = month - 1; if (m < 1) renderDateSearch(year - 1, 12); else renderDateSearch(year, m); }; const nextBtn = document.createElement('button'); nextBtn.textContent = '›'; nextBtn.onclick = () => { const m = month + 1; if (m > 12) renderDateSearch(year + 1, 1); else renderDateSearch(year, m); }; const monthLabel = document.createElement('span'); monthLabel.className = 'cal-month'; monthLabel.textContent = `${year}年${month}月`; calHeader.appendChild(prevBtn); calHeader.appendChild(monthLabel); calHeader.appendChild(nextBtn); calDiv.appendChild(calHeader); const table = document.createElement('table'); table.className = 'cal-table'; const thead = document.createElement('thead'); const trH = document.createElement('tr'); ['日', '一', '二', '三', '四', '五', '六'].forEach(d => { const th = document.createElement('th'); th.textContent = d; trH.appendChild(th); }); thead.appendChild(trH); table.appendChild(thead); const tbody = document.createElement('tbody'); const chatDates = new Set(); for (const chatId in appData.msg) { (appData.msg[chatId] || []).forEach(m => { const d = new Date(m.time); chatDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); }); } const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; const firstDay = new Date(year, month - 1, 1).getDay(); const daysInMonth = new Date(year, month, 0).getDate(); const prevMonth = month - 1 < 1 ? 12 : month - 1; const prevYear = month - 1 < 1 ? year - 1 : year; const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate(); let date = 1, nextMonthDate = 1; const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7; for (let i = 0; i < totalCells; i++) { if (i % 7 === 0) { var row = document.createElement('tr'); tbody.appendChild(row); } const td = document.createElement('td'); if (i < firstDay) { const d = daysInPrevMonth - firstDay + i + 1; td.textContent = d; td.className = 'other-month'; const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`; if (chatDates.has(dateStr)) td.classList.add('has-chat'); } else if (date <= daysInMonth) { td.textContent = date; const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`; if (chatDates.has(dateStr)) td.classList.add('has-chat'); else td.classList.add('no-chat'); if (dateStr === todayStr) td.classList.add('today'); td.onclick = () => showDateMessages(dateStr); date++; } else { td.textContent = nextMonthDate; td.className = 'other-month'; const nextMonth = month + 1 > 12 ? 1 : month + 1; const nextYear = month + 1 > 12 ? year + 1 : year; const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextMonthDate).padStart(2, '0')}`; if (chatDates.has(dateStr)) td.classList.add('has-chat'); nextMonthDate++; } row.appendChild(td); } table.appendChild(tbody); calDiv.appendChild(table); container.appendChild(calDiv); const msgList = document.createElement('div'); msgList.id = 'dateMsgList'; msgList.style.marginTop = '10px'; container.appendChild(msgList); }
function showDateMessages(dateStr) { const msgList = document.getElementById('dateMsgList'); if (!msgList) return; while (msgList.firstChild) msgList.removeChild(msgList.firstChild); const title = document.createElement('div'); title.style.fontWeight = 'bold'; title.textContent = dateStr; title.style.marginBottom = '8px'; msgList.appendChild(title); const allMsgs = []; for (const chatId in appData.msg) { (appData.msg[chatId] || []).forEach(m => { const d = new Date(m.time); const mDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (mDate === dateStr) allMsgs.push({ ...m, chatId }); }); } allMsgs.sort((a, b) => new Date(a.time) - new Date(b.time)); if (!allMsgs.length) { msgList.innerHTML += '<div style="text-align:center;color:var(--text-secondary);padding:20px">无消息</div>'; return; } allMsgs.forEach(m => { const contactName = m.chatName || (getContact(m.chatId)?.name || m.chatId); const div = document.createElement('div'); div.style.cssText = 'padding:8px;border-bottom:1px solid var(--border-light);cursor:pointer'; div.innerHTML = `<b>${escapeHtml(m.me ? '我' : m.senderName || contactName)}</b> · ${escapeHtml(contactName)}<br><span style="font-size:13px">${escapeHtml(m.text || (m.voice ? '[语音]' : '[图片]') || '')}</span><br><span style="font-size:11px;color:var(--text-secondary)">${new Date(m.time).toLocaleTimeString()}</span>`; div.onclick = () => { document.getElementById('dateSearchPage').classList.remove('active'); currentChatId = m.chatId; openChat(); setTimeout(() => { const msgEl = document.querySelector(`.msg-row[data-msg-time="${m.time}"]`); if (msgEl) { msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); msgEl.style.backgroundColor = 'rgba(197,164,126,0.2)'; setTimeout(() => msgEl.style.backgroundColor = '', 1500); } }, 100); }; msgList.appendChild(div); }); }

function openImageSearchPage() { document.getElementById('searchPage').classList.remove('active'); document.getElementById('imageSearchPage').classList.add('active'); renderImageSearch(); }
function renderImageSearch() { const container = document.getElementById('imageSearchPageContent'); while (container.firstChild) container.removeChild(container.firstChild); const grid = document.createElement('div'); grid.className = 'image-search-grid'; const allImages = []; const searchTargets = (currentChatId && currentChatId !== 'me') ? { [currentChatId]: appData.msg[currentChatId] || [] } : appData.msg; for (const chatId in searchTargets) { (searchTargets[chatId] || []).forEach(m => { if (m.image && !m.voice) allImages.push({ ...m, chatId }); }); } allImages.sort((a, b) => new Date(b.time) - new Date(a.time)); if (!allImages.length) { container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px">暂无图片</div>'; return; } allImages.forEach(m => { const thumb = document.createElement('div'); thumb.className = 'img-thumb'; const img = document.createElement('img'); if (m.image && !m.image.startsWith('data:image')) { loadMedia(m.image).then(data => { if (data) img.src = data; else img.style.display = 'none'; }); } else { img.src = m.image; } img.onerror = () => { thumb.style.display = 'none'; }; thumb.appendChild(img); const sender = document.createElement('div'); sender.className = 'img-sender'; sender.textContent = m.me ? '我' : (m.senderName || ''); thumb.appendChild(sender); thumb.onclick = () => { document.getElementById('imageSearchPage').classList.remove('active'); currentChatId = m.chatId; openChat(); setTimeout(() => { const msgEl = document.querySelector(`.msg-row[data-msg-time="${m.time}"]`); if (msgEl) { msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); msgEl.style.backgroundColor = 'rgba(197,164,126,0.2)'; setTimeout(() => msgEl.style.backgroundColor = '', 1500); } }, 100); }; grid.appendChild(thumb); }); container.appendChild(grid); }

function openVoiceSearchPage() { document.getElementById('searchPage').classList.remove('active'); document.getElementById('voiceSearchPage').classList.add('active'); renderVoiceSearch(); }
function renderVoiceSearch() { const container = document.getElementById('voiceSearchPageContent'); while (container.firstChild) container.removeChild(container.firstChild); const list = document.createElement('div'); list.className = 'voice-search-list'; const allVoices = []; const searchTargets = (currentChatId && currentChatId !== 'me') ? { [currentChatId]: appData.msg[currentChatId] || [] } : appData.msg; for (const chatId in searchTargets) { (searchTargets[chatId] || []).forEach(m => { if (m.voice) allVoices.push({ ...m, chatId }); }); } allVoices.sort((a, b) => new Date(b.time) - new Date(a.time)); if (!allVoices.length) { container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px">暂无语音</div>'; return; } allVoices.forEach(m => { const item = document.createElement('div'); item.className = 'voice-search-item'; item.innerHTML = `<span class="voice-icon">🔊</span><div class="voice-info"><div><b>${escapeHtml(m.me ? '我' : m.senderName || '')}</b></div><div class="voice-duration">${m.voiceDuration || 0}″ · ${new Date(m.time).toLocaleString()}</div>${m.voiceNote ? `<div style="font-size:11px;color:var(--text-secondary);font-style:italic;">备注: ${escapeHtml(m.voiceNote)}</div>` : ''}</div>`; item.onclick = () => { document.getElementById('voiceSearchPage').classList.remove('active'); currentChatId = m.chatId; openChat(); setTimeout(() => { const msgEl = document.querySelector(`.msg-row[data-msg-time="${m.time}"]`); if (msgEl) { msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); msgEl.style.backgroundColor = 'rgba(197,164,126,0.2)'; setTimeout(() => msgEl.style.backgroundColor = '', 1500); } }, 100); }; list.appendChild(item); }); container.appendChild(list); }

function openMusicSearchPage() { document.getElementById('searchPage').classList.remove('active'); document.getElementById('musicSearchPage').classList.add('active'); renderMusicSearch(); }
function renderMusicSearch() { const container = document.getElementById('musicSearchPageContent'); while (container.firstChild) container.removeChild(container.firstChild); const list = document.createElement('div'); list.className = 'music-search-list'; const allMusic = []; const musicSearchTargets = (currentChatId && currentChatId !== 'me') ? { [currentChatId]: appData.msg[currentChatId] || [] } : appData.msg; for (const chatId in musicSearchTargets) { (musicSearchTargets[chatId] || []).forEach(m => { if ((m.text && (m.text.startsWith('🎵 分享了一首歌') || m.text.startsWith('🎶 分享了一首歌') || m.text.startsWith('🌟') || m.text.startsWith('🎧'))) || (m.type === 'share' && m.text && (m.text.startsWith('🎵') || m.text.startsWith('🎶') || m.text.startsWith('🌟')))) allMusic.push({ ...m, chatId }); }); } allMusic.sort((a, b) => new Date(b.time) - new Date(a.time)); if (!allMusic.length) { container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px">暂无分享的音乐</div>'; return; } allMusic.forEach(m => { const item = document.createElement('div'); item.className = 'music-search-item'; const displayName = m.senderId === 'me' ? appData.myProfile.name : (m.senderName || ''); item.innerHTML = `<span class="music-icon">🎵</span><div class="music-info"><div><b>${escapeHtml(displayName)}</b></div><div>${escapeHtml(m.text)}</div><div style="font-size:11px;color:var(--text-secondary)">${new Date(m.time).toLocaleString()}</div></div>`; item.onclick = () => { document.getElementById('musicSearchPage').classList.remove('active'); currentChatId = m.chatId; openChat(); setTimeout(() => { const msgEl = document.querySelector(`[data-msg-time="${m.time}"]`); if (msgEl) { msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); msgEl.style.backgroundColor = 'rgba(197,164,126,0.2)'; setTimeout(() => msgEl.style.backgroundColor = '', 1500); } const songTitle = m.text.replace(/🎵 分享了一首歌《(.+?)》.*/, '$1').replace(/🌟 .+ 分享了《(.+?)》.*/, '$1').replace(/🎶 分享了一首歌《(.+?)》.*/, '$1'); const pl = appData.musicPlaylists[0]; if (pl) { const idx = pl.songs.findIndex(s => s.title === songTitle); if (idx >= 0) { musicCurrentPlaylistIndex = 0; musicCurrentSongIndex = idx; musicPlayIndex(idx, true); } } }, 100); }; list.appendChild(item); }); container.appendChild(list); }

// ========== 分享列表选择 ==========
function shareBookWithList() { const books = appData.bookLists.flatMap(l => l.books); if (!books.length) { toast('书单为空'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '选择分享书籍'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; books.forEach(b => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = `${b.title} - ${b.author || ''}`; btn.onclick = () => { shareBookToContact(b); overlay.remove(); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }
function shareMovieWithList() { const movies = appData.movieLists.flatMap(l => l.movies); if (!movies.length) { toast('电影列表为空'); return; } const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '选择分享电影'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; movies.forEach(m => { const btn = document.createElement('button'); btn.className = 'btn'; btn.style.cssText = 'width:100%;text-align:left;'; btn.textContent = `${m.title} (${m.year || ''}) - ${m.director || ''}`; btn.onclick = () => { shareMovieToContact(m); overlay.remove(); }; body.appendChild(btn); }); card.appendChild(body); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }

// ========== 全局备份导入 ==========
document.getElementById('restoreFileInput').onchange = async function(e) { const file = e.target.files[0]; if (!file) return; try { let data; if (file.name.endsWith('.zip')) { if (typeof JSZip === 'undefined') { toast('JSZip 未加载，无法导入 ZIP 备份，请刷新页面后重试'); return; } const arrayBuffer = await file.arrayBuffer(); const zip = await JSZip.loadAsync(arrayBuffer); const jsonFile = zip.file('backup.json'); if (!jsonFile) { toast('ZIP 内未找到 backup.json', 4000); return; } const raw = await jsonFile.async('string'); data = JSON.parse(raw); if (data.msg) { for (const chatId in data.msg) { const msgs = data.msg[chatId] || []; for (const m of msgs) { if (m.image && m.image.startsWith('data:image')) { const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8); await saveMedia(id, m.image); m.image = id; } if (m.voice && m.voice.startsWith('data:audio')) { const id = 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8); await saveMedia(id, m.voice); m.voice = id; } } } } const mediaFolder = zip.folder('media'); if (mediaFolder) { const mediaFileNames = Object.keys(mediaFolder.files).filter(name => !mediaFolder.files[name].dir); for (const fileName of mediaFileNames) { try { const fileData = await mediaFolder.files[fileName].async('uint8array'); const mime = fileName.startsWith('voice_') ? 'audio/webm' : 'image/jpeg'; let binary = ''; const chunkSize = 0x8000; const bytes = new Uint8Array(fileData); for (let i = 0; i < bytes.length; i += chunkSize) { binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.length))); } const base64 = 'data:' + mime + ';base64,' + btoa(binary); await saveMedia(fileName, base64); } catch (e2) { console.warn('[导入] 媒体文件恢复失败:', fileName, e2); } } } } else { const text = await file.text(); data = JSON.parse(text); } const hasValidData = (data.globalCardGroups || data.cards || data.phrases || data.msg || data.users || data.moments || data.letters || data.customReplyGroups); if (!hasValidData) { toast('格式不正确：缺少关键数据字段（globalCardGroups/msg/users等）', 4000); return; } toast('正在解析备份文件...', 0); showImportModeDialog((mode) => { if (mode === 'overwrite') { appData = { ...appData, ...data }; } else { if (data.globalCardGroups) { data.globalCardGroups.forEach(g => { const existing = appData.globalCardGroups.find(eg => eg.name === g.name); if (existing) existing.list = uniqueArr([...existing.list, ...g.list]); else appData.globalCardGroups.push(g); }); } if (data.users) { data.users.forEach(u => { const existing = appData.users.find(eu => eu.id === u.id); if (existing) { Object.assign(existing, u); } else { appData.users.push(u); } }); } if (data.msg) { for (const chatId in data.msg) { if (!appData.msg[chatId]) appData.msg[chatId] = []; const existingKeys = new Set(appData.msg[chatId].map(m => getMsgKey(m))); data.msg[chatId].forEach(m => { if (!existingKeys.has(getMsgKey(m))) appData.msg[chatId].push(m); }); } } if (data.moments) { for (const uid in data.moments) { if (!appData.moments[uid]) appData.moments[uid] = []; const em = new Set(appData.moments[uid].map(m => m.time)); data.moments[uid].forEach(m => { if (!em.has(m.time)) appData.moments[uid].push(m); }); } } if (data.letters) { for (const uid in data.letters) { if (!appData.letters[uid]) appData.letters[uid] = []; const ec = new Set(appData.letters[uid].map(l => l.cid)); data.letters[uid].forEach(l => { if (!ec.has(l.cid)) appData.letters[uid].push(l); }); } } if (data.musicPlaylists) { data.musicPlaylists.forEach(pl => { const existing = appData.musicPlaylists.find(epl => epl.name === pl.name); if (existing) { pl.songs.forEach(s => { if (!existing.songs.some(es => es.title === s.title && es.url === s.url)) existing.songs.push(s); }); } else { appData.musicPlaylists.push(pl); } }); } if (data.bookLists) { data.bookLists.forEach(bl => { const existing = appData.bookLists.find(ebl => ebl.name === bl.name); if (existing) { bl.books.forEach(b => { if (!existing.books.some(eb => eb.title === b.title && eb.author === b.author)) existing.books.push(b); }); } else { appData.bookLists.push(bl); } }); } if (data.movieLists) { data.movieLists.forEach(ml => { const existing = appData.movieLists.find(eml => eml.name === ml.name); if (existing) { ml.movies.forEach(m => { if (!existing.movies.some(em => em.title === m.title && em.director === m.director && em.year === m.year)) existing.movies.push(m); }); } else { appData.movieLists.push(ml); } }); } if (data.companionTasks) { data.companionTasks.forEach(t => { if (!appData.companionTasks.some(et => et.id === t.id)) appData.companionTasks.push(t); }); } } deepCleanAllCards(); markDataChanged(); save(); try { localStorage.setItem('Mo_theme_backup', appData.themeColor); } catch (e) {} applyTheme(appData.themeColor || '#c5a47e'); toast('导入成功'); }); } catch (err) { toast('文件损坏，无法解析', 4000); } e.target.value = ''; };

// 文件上传处理
document.getElementById('globalBatchFileInput').addEventListener('change', function(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { const result = parseFileContent(ev.target.result, f.name); if (result.parseError) { toast('文件格式错误，无法解析'); return; } if (result.noValidData || (result.cards.length === 0 && result.groups.length === 0)) { toast('未找到有效字卡数据'); return; } if (result.isMilk && result.groups.length > 0) { importMilkGroupsToGlobal(result.groups); } else if (result.groups.length > 0) { result.groups.forEach(g => importCardsToGlobal(g.list, g.name, true)); toast(`导入 ${result.groups.length} 个分组，共 ${result.totalItems || 0} 条字卡`); } else { importCardsToGlobal(result.cards, this._targetGroup || '未分组'); } if (document.getElementById('globalCardsPage').classList.contains('active')) { updateGlobalView(); } }; r.readAsText(f); this.value = ''; });
document.getElementById('userBatchFileInput').addEventListener('change', function(e) { const f = e.target.files[0]; if (!f) return; const user = this._targetUser || window.tempUser; const r = new FileReader(); r.onload = ev => { const result = parseFileContent(ev.target.result, f.name); if (result.parseError) { toast('文件格式错误，无法解析'); return; } if (result.noValidData || (result.cards.length === 0 && result.groups.length === 0)) { toast('未找到有效字卡数据'); return; } if (result.isMilk && result.groups.length > 0) { importMilkGroupsToUser(user, result.groups); } else if (result.groups.length > 0) { result.groups.forEach(g => importUserCards(user, g.list, g.name, true)); toast(`导入 ${result.groups.length} 个分组，共 ${result.totalItems || 0} 条字卡`); } else { importUserCards(user, result.cards, this._targetGroup || '未分组'); } if (document.getElementById('userCardsPage').classList.contains('active')) { updateUserView(); } }; r.readAsText(f); this.value = ''; });

document.getElementById('restoreCardsInput').onchange = function(e) { const f = e.target.files[0]; if (!f) return; const contactId = this._contactId; showImportModeDialog((mode) => { const reader = new FileReader(); reader.onload = function(ev) { try { const data = JSON.parse(ev.target.result); let processed = false; if (data.globalCardGroups) { if (mode === 'overwrite') { appData.globalCardGroups = data.globalCardGroups; processed = true; } else { data.globalCardGroups.forEach(g => { const existing = appData.globalCardGroups.find(eg => eg.name === g.name); if (existing) existing.list = uniqueArr([...existing.list, ...g.list]); else appData.globalCardGroups.push(g); }); processed = true; } } else if (data.cards) { if (mode === 'overwrite') { appData.globalCardGroups = [{ name: '未分组', list: data.cards }]; processed = true; } else { importCardsToGlobal(data.cards, '未分组', true); processed = true; } } else if (data.phrases) { if (mode === 'overwrite') { appData.globalCardGroups = [{ name: '未分组', list: data.phrases }]; processed = true; } else { importCardsToGlobal(data.phrases, '未分组', true); processed = true; } } else if (data.cardGroups && contactId) { const u = getContact(contactId); if (u) { if (mode === 'overwrite') { u.cardGroups = data.cardGroups; } else { data.cardGroups.forEach(g => { const existing = u.cardGroups.find(eg => eg.name === g.name); if (existing) existing.list = uniqueArr([...existing.list, ...g.list]); else u.cardGroups.push({ name: g.name, list: g.list }); }); } processed = true; } } if (processed) { markDataChanged(); save(); toast('字卡导入成功'); if (document.getElementById('globalCardsPage').classList.contains('active')) { updateGlobalView(); } else if (document.getElementById('userCardsPage').classList.contains('active')) { updateUserView(); } } else { toast('文件中无有效字卡数据'); } } catch { toast('文件损坏，无法解析'); } }; reader.readAsText(f); }); this.value = ''; this._contactId = null; };

document.getElementById('restoreEmojisInput').onchange = function(e) { const f = e.target.files[0]; if (!f) return; const contactId = this._contactId; showImportModeDialog((mode) => { const reader = new FileReader(); reader.onload = function(ev) { try { const data = JSON.parse(ev.target.result); let processed = false; if (data.globalEmojis || data.userEmo) { if (mode === 'overwrite') { if (data.globalEmojis) appData.globalEmojis = data.globalEmojis; if (data.userEmo) appData.userEmo = data.userEmo; } else { if (data.globalEmojis) appData.globalEmojis = uniqueArr([...appData.globalEmojis, ...data.globalEmojis]); if (data.userEmo) Object.keys(data.userEmo).forEach(k => { if (!appData.userEmo[k]) appData.userEmo[k] = []; appData.userEmo[k] = uniqueArr([...appData.userEmo[k], ...data.userEmo[k]]); }); } processed = true; } else if (data.emojis && contactId) { if (mode === 'overwrite') { appData.userEmo[contactId] = data.emojis || []; if (data.images) appData.userImages[contactId] = data.images || []; } else { if (data.emojis) appData.userEmo[contactId] = uniqueArr([...(appData.userEmo[contactId] || []), ...data.emojis]); if (data.images) appData.userImages[contactId] = uniqueArr([...(appData.userImages[contactId] || []), ...data.images]); } processed = true; } if (processed) { markDataChanged(); save(); toast('表情导入成功'); if (document.getElementById('emojiManagerPage').classList.contains('active')) { renderEmojiManagerContent(); } } else { toast('文件中无有效表情数据'); } } catch { toast('文件损坏，无法解析'); } }; reader.readAsText(f); }); this.value = ''; this._contactId = null; };

document.getElementById('restoreChatInput').onchange = function(e) { const f = e.target.files[0]; if (!f) return; const contactId = this._contactId; showImportModeDialog((mode) => { const reader = new FileReader(); reader.onload = function(ev) { try { const data = JSON.parse(ev.target.result); let processed = false; if (data.msg) { if (mode === 'overwrite') { appData.msg = data.msg; } else { Object.keys(data.msg).forEach(k => { if (!appData.msg[k]) appData.msg[k] = []; const existingKeys = new Set(appData.msg[k].map(m => getMsgKey(m))); data.msg[k].forEach(m => { if (!existingKeys.has(getMsgKey(m))) appData.msg[k].push(m); }); }); } processed = true; } else if (data.chat && contactId) { if (mode === 'overwrite') { appData.msg[contactId] = data.chat; } else { if (!appData.msg[contactId]) appData.msg[contactId] = []; const existingKeys = new Set(appData.msg[contactId].map(m => getMsgKey(m))); data.chat.forEach(m => { if (!existingKeys.has(getMsgKey(m))) appData.msg[contactId].push(m); }); } processed = true; } if (processed) { markDataChanged(); save(); toast('聊天记录导入成功'); } else { toast('文件中无有效聊天数据'); } } catch { toast('文件损坏，无法解析'); } }; reader.readAsText(f); }); this.value = ''; this._contactId = null; };

window.fileTarget = null;
document.getElementById('fileAvatar').onchange = async function(e) { const f = e.target.files[0]; if (!f) return; const capturedId = this._capturedUserId; try { const b64 = await processImage(f, 400, 0.95); if (capturedId === 'me') { if (b64 === appData.myProfile.avt) { toast('该头像已在使用'); return; } appData.myProfile.avt = b64; markDataChanged(); save(); const myAvatarInList = document.querySelector('.chat-item[data-id="me"] .avatar'); if (myAvatarInList) { while (myAvatarInList.firstChild) myAvatarInList.removeChild(myAvatarInList.firstChild); const img = document.createElement('img'); img.src = b64; myAvatarInList.appendChild(img); } const avatarContainer = document.getElementById('myProfileAvatar'); if (avatarContainer) { while (avatarContainer.firstChild) avatarContainer.removeChild(avatarContainer.firstChild); const img = document.createElement('img'); img.src = b64; avatarContainer.appendChild(img); } toast('头像已更新'); } else if (capturedId && capturedId !== 'me') { const u = getContact(capturedId); if (u) { if (b64 === u.avt) { toast('该头像已在使用'); return; } u.avt = b64; markDataChanged(); save(); const listAvatar = document.querySelector(`.chat-item[data-id="${capturedId}"] .avatar`); if (listAvatar) { while (listAvatar.firstChild) listAvatar.removeChild(listAvatar.firstChild); const img = document.createElement('img'); img.src = b64; listAvatar.appendChild(img); } if (document.getElementById('contactDetailPage').classList.contains('active')) { const detailAvatar = document.querySelector('#contactDetailContent .avatar'); if (detailAvatar) { while (detailAvatar.firstChild) detailAvatar.removeChild(detailAvatar.firstChild); const img = document.createElement('img'); img.src = b64; detailAvatar.appendChild(img); } } renderMessages(); toast('头像已更新'); } } } catch { toast('头像上传失败'); } window.fileTarget = null; this._capturedUserId = null; this.value = ''; };
document.getElementById('fileBg').onchange = async function(e) { const f = e.target.files[0]; if (!f) return; try { const b64 = await processImage(f, 4096, 0.92); const targetId = bgUploadTargetId || currentChatId || 'me'; const t = getContact(targetId); if (t) { if (t.bg === b64) { toast('该背景已在使用'); return; } t.bg = b64; if (!appData.userBgs[targetId]) appData.userBgs[targetId] = []; if (!appData.userBgs[targetId].includes(b64)) appData.userBgs[targetId].push(b64); if (currentChatId === targetId) { document.getElementById('chatMessages').style.backgroundImage = `url(${b64})`; document.getElementById('chatMessages').style.backgroundSize = 'cover'; document.getElementById('chatMessages').style.backgroundRepeat = 'no-repeat'; document.getElementById('chatMessages').style.backgroundPosition = 'center'; } markDataChanged(); setTimeout(() => save(), 200); toast('背景已更新并保存到图库'); } } catch { toast('背景更新失败'); } bgUploadTargetId = null; this.value = ''; };
document.getElementById('globalEmojiFile').onchange = async function(e) { const fs = Array.from(e.target.files); let skipped = 0, added = 0; for (const f of fs) { try { const b64 = await processImage(f, 250); if (appData.globalEmojis.includes(b64) || Object.values(appData.userEmo).flat().includes(b64)) { skipped++; continue; } appData.globalEmojis.push(b64); added++; } catch {} } markDataChanged(); save(); if (currentChatId) renderEmojiPanel(); if (document.getElementById('emojiManagerPage').classList.contains('active')) { renderEmojiManagerContent(); } toast(skipped ? `跳过 ${skipped} 条重复，添加 ${added} 条` : `添加 ${added} 条表情`); this.value = ''; };
document.getElementById('imageLibFile').onchange = async function(e) { const fs = Array.from(e.target.files); if (fs.length && currentChatId) { if (!appData.userImages[currentChatId]) appData.userImages[currentChatId] = []; let skipped = 0, added = 0; for (const f of fs) { try { const b64 = await processImage(f, 250); if (appData.userImages[currentChatId].includes(b64) || appData.globalEmojis.includes(b64) || Object.values(appData.userEmo).flat().includes(b64)) { skipped++; continue; } appData.userImages[currentChatId].push(b64); added++; } catch {} } markDataChanged(); save(); renderImagePanel(); toast(skipped ? `跳过 ${skipped} 条，添加 ${added} 条图片` : `添加 ${added} 条图片`); } e.target.value = ''; };
document.getElementById('emojiFile').onchange = async function(e) { const fs = Array.from(e.target.files); if (fs.length && currentChatId) { if (!appData.userEmo[currentChatId]) appData.userEmo[currentChatId] = []; let skipped = 0, added = 0; for (const f of fs) { try { const b64 = await processImage(f, 250); if (appData.userEmo[currentChatId].includes(b64) || appData.globalEmojis.includes(b64)) { skipped++; continue; } appData.userEmo[currentChatId].push(b64); added++; } catch {} } markDataChanged(); save(); renderEmojiPanel(); toast(skipped ? `跳过 ${skipped} 条，添加 ${added} 条专属表情` : `添加 ${added} 条专属表情`); } e.target.value = ''; };

const bgFileInput = document.createElement('input'); bgFileInput.type = 'file'; bgFileInput.accept = 'image/*'; bgFileInput.id = 'bgFileInput'; bgFileInput.style.display = 'none';
bgFileInput.onchange = async function(e) { const f = e.target.files[0]; if (!f) return; const targetId = bgUploadTargetId || currentChatId || 'me'; try { const b64 = await processImage(f, 4096, 0.92); if (!appData.userBgs[targetId]) appData.userBgs[targetId] = []; if (appData.userBgs[targetId].includes(b64)) { toast('背景图已存在'); return; } appData.userBgs[targetId].push(b64); markDataChanged(); save(); if (document.getElementById('myBgPage').classList.contains('active')) { renderBgPageContent('me'); } else if (document.getElementById('contactBgPage').classList.contains('active')) { renderBgPageContent(_contactBgUserId); } toast('背景图已添加'); } catch { toast('背景图添加失败'); } bgUploadTargetId = null; e.target.value = ''; };
document.body.appendChild(bgFileInput);

// ========== 工具栏折叠 ==========
function toggleToolsBar() { toolsBarCollapsed = !toolsBarCollapsed; const bar = document.getElementById('toolsBar'); const toggle = document.getElementById('toggleToolsBtn'); const bar2 = document.getElementById('toolsRow2'); if (toolsBarCollapsed) { bar.classList.add('collapsed'); if (bar2) bar2.style.display = 'none'; toolsBar2Collapsed = true; toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>'; } else { bar.classList.remove('collapsed'); if (!toolsBar2Collapsed && bar2) bar2.style.display = 'flex'; toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>'; } }
function toggleToolsRow() { toolsRowCollapsed = !toolsRowCollapsed; const row = document.getElementById('toolsRow'); const toggle = document.getElementById('toggleToolsRowBtn'); if (toolsRowCollapsed) { row.classList.add('collapsed'); toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'; } else { row.classList.remove('collapsed'); toggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>'; } }
function toggleSecondRow() { toolsBar2Collapsed = !toolsBar2Collapsed; const bar2 = document.getElementById('toolsRow2'); if (bar2) bar2.style.display = toolsBar2Collapsed ? 'none' : 'flex'; }

// ========== 页面导航 ==========
function hideAllPages() {
  const pages = ['chatsPage', 'chatPage', 'contactsPage', 'contactDetailPage', 'discoverPage', 'momentsPage', 'mailboxPage', 'letterPage', 'mePage', 'pokePage', 'emojiManagerPage', 'blockedPage', 'globalCardsPage', 'userCardsPage', 'myBgPage', 'contactBgPage', 'searchPage', 'dateSearchPage', 'imageSearchPage', 'voiceSearchPage', 'musicSearchPage', 'bookSearchPage', 'movieSearchPage', 'musicPage', 'companionPage', 'bookListPage', 'movieListPage', 'tarotPage', 'movieTogetherPage', 'datingPage', 'gomokuPage','goPage','colorSavePage','navBgPage'];
  pages.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
}
function setActiveNav(navName) { document.querySelectorAll('.page .nav-item').forEach(n => { n.classList.remove('active'); n.style.background = ''; n.style.color = ''; n.style.fontWeight = ''; const svg = n.querySelector('svg'); if (svg) { svg.style.color = ''; svg.style.stroke = ''; } const span = n.querySelector('span'); if (span) span.style.color = ''; }); document.querySelectorAll(`.page .nav-item[data-nav="${navName}"]`).forEach(n => { n.classList.add('active'); }); }
function switchToChatsTab() { if (appData.companionImmersiveMode && document.getElementById('companionActivePage').classList.contains('active')) { toast('陪伴沉浸模式中，无法切换页面'); return; } hideAllPages(); document.getElementById('chatsPage').classList.add('active'); setActiveNav('chats'); }
function switchToContactsTab() { if (appData.companionImmersiveMode && document.getElementById('companionActivePage').classList.contains('active')) { toast('陪伴沉浸模式中，无法切换页面'); return; } hideAllPages(); document.getElementById('contactsPage').classList.add('active'); setActiveNav('contacts'); }
function switchToDiscoverTab() { if (appData.companionImmersiveMode && document.getElementById('companionActivePage').classList.contains('active')) { toast('陪伴沉浸模式中，无法切换页面'); return; } hideAllPages(); document.getElementById('discoverPage').classList.add('active'); setActiveNav('discover'); }
function switchToMeTab() { if (appData.companionImmersiveMode && document.getElementById('companionActivePage').classList.contains('active')) { toast('陪伴沉浸模式中，无法切换页面'); return; } hideAllPages(); document.getElementById('mePage').classList.add('active'); setActiveNav('me'); }

// ========== 字卡渲染 ==========
function renderCardList(cid, groups, mode, gi, sid, said, disabledCards, disabledOnly) { const c = document.getElementById(cid); if (!c) return; const kw = (document.getElementById(sid)?.value || '').toLowerCase(); let d = []; if (mode === 'all') d = uniqueArr(groups.flatMap(g => g.list)); else if (mode === 'ungrouped') { const g = groups.find(g => g.name === '未分组'); d = g ? g.list : []; } else d = groups[gi]?.list || []; let f = kw ? d.filter(i => i.toLowerCase().includes(kw)) : d; if (disabledOnly) f = f.filter(item => disabledCards.includes(item)); while (c.firstChild) c.removeChild(c.firstChild); const fragment = document.createDocumentFragment(); f.forEach(item => { const div = document.createElement('div'); div.className = 'card-item' + (disabledCards.includes(item) ? ' disabled' : ''); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'card-checkbox'; checkbox.checked = selectedCards.has(item); checkbox.onchange = () => { if (checkbox.checked) selectedCards.add(item); else selectedCards.delete(item); }; const span = document.createElement('span'); span.textContent = item; span.style.cursor = 'pointer'; span.onclick = (e) => { e.stopPropagation(); const origText = span.textContent; const input = document.createElement('input'); input.type = 'text'; input.value = origText; input.style.cssText = 'width:80%;padding:4px;border-radius:8px;border:1px solid var(--theme);font-size:13px;'; span.replaceWith(input); input.focus(); input.select(); const saveEdit = () => { const newText = sanitizeText(input.value.trim()); if (newText && newText !== origText) { const targetGroups = cid === 'glist' ? appData.globalCardGroups : (window.tempUser?.cardGroups || []); for (const g of targetGroups) { const idx = g.list.indexOf(origText); if (idx > -1) { g.list[idx] = newText; break; } } if (disabledCards.includes(origText)) { if (cid === 'glist') { const i = appData.disabledGlobalCards.indexOf(origText); if (i > -1) appData.disabledGlobalCards[i] = newText; } else { const uid = window._currentCardsUserId || currentChatId; const arr = appData.disabledUserCards[uid] || []; const i = arr.indexOf(origText); if (i > -1) arr[i] = newText; } } markDataChanged(); save(); refreshCardView(groups, cid); toast('词条已更新'); } else { input.replaceWith(span); } }; input.addEventListener('blur', saveEdit); input.addEventListener('keypress', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); } }); }; const toggleBtn = document.createElement('span'); toggleBtn.style.marginLeft = '4px'; toggleBtn.style.cursor = 'pointer'; toggleBtn.style.color = 'var(--theme)'; toggleBtn.textContent = disabledCards.includes(item) ? '✅' : '🚫'; toggleBtn.onclick = (e) => { e.stopPropagation(); toggleCardDisable(item, cid, groups); }; div.appendChild(checkbox); div.appendChild(span); div.appendChild(toggleBtn); fragment.appendChild(div); }); c.appendChild(fragment); const ac = document.getElementById(said); if (ac) { ac.checked = f.length > 0 && f.every(item => selectedCards.has(item)); ac.onchange = () => { if (ac.checked) { f.forEach(item => selectedCards.add(item)); } else { f.forEach(item => selectedCards.delete(item)); } renderCardList(cid, groups, mode, gi, sid, said, disabledCards, disabledOnly); }; } const countSpan = document.getElementById(cid + '_count'); if (countSpan) countSpan.textContent = `(${f.length})`; }
function toggleCardDisable(card, cid, groups) { if (cid === 'glist') { if (appData.disabledGlobalCards.includes(card)) appData.disabledGlobalCards = appData.disabledGlobalCards.filter(c => c !== card); else appData.disabledGlobalCards.push(card); } else { const userId = window._currentCardsUserId || currentChatId; if (!appData.disabledUserCards[userId]) appData.disabledUserCards[userId] = []; if (appData.disabledUserCards[userId].includes(card)) appData.disabledUserCards[userId] = appData.disabledUserCards[userId].filter(c => c !== card); else appData.disabledUserCards[userId].push(card); } markDataChanged(); save(); refreshCardView(groups, cid); }
function batchDisableSelected(cid, groups) { const cards = [...selectedCards]; if (!cards.length) { toast("请先选择字卡"); return; } cards.forEach(c => { if (cid === 'glist') { if (!appData.disabledGlobalCards.includes(c)) appData.disabledGlobalCards.push(c); } else { const userId = window._currentCardsUserId || currentChatId; if (!appData.disabledUserCards[userId]) appData.disabledUserCards[userId] = []; if (!appData.disabledUserCards[userId].includes(c)) appData.disabledUserCards[userId].push(c); } }); markDataChanged(); save(); refreshCardView(groups, cid); selectedCards.clear(); }
function moveSelectedCards(groups, cid, target) { const cards = [...selectedCards]; if (!cards.length) { toast("请先选择字卡"); return; } const tg = groups.find(g => g.name === target); if (!tg) return; groups.forEach(g => g.list = g.list.filter(i => !cards.includes(i))); tg.list = uniqueArr([...tg.list, ...cards]); markDataChanged(); save(); selectedCards.clear(); refreshCardView(groups, cid); }
function refreshCardView(groups, cid) { const m = cid === 'glist' ? globalViewMode : userViewMode; const sid = cid === 'glist' ? 'gsel' : 'usel', searchId = cid === 'glist' ? 'gsearch' : 'usearch', said = cid === 'glist' ? 'gsa' : 'usa'; const disabled = cid === 'glist' ? appData.disabledGlobalCards : (appData.disabledUserCards[window._currentCardsUserId || currentChatId] || []); const disabledOnly = cid === 'glist' ? (document.getElementById('gdisabledOnly')?.checked || false) : (document.getElementById('udisabledOnly')?.checked || false); if (m === 'groups') { const s = document.getElementById(sid); if (s) { renderCardList(cid, groups, m, parseInt(s.value), searchId, said, disabled, disabledOnly); } } else { renderCardList(cid, groups, m, null, searchId, said, disabled, disabledOnly); } }

function showGroupSelectDialog(groups, callback) { const overlay = document.createElement('div'); overlay.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '选择目标分组'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => overlay.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; const select = document.createElement('select'); select.id = 'gselTarget'; select.style.cssText = 'width:100%;padding:8px;border-radius:12px;border:1px solid var(--border-light)'; groups.forEach((g, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = g.name; select.appendChild(opt); }); body.appendChild(select); card.appendChild(body); const footer = document.createElement('div'); footer.className = 'pop-footer'; const cancelBtn = document.createElement('button'); cancelBtn.className = 'btn'; cancelBtn.textContent = '取消'; cancelBtn.onclick = () => overlay.remove(); const okBtn = document.createElement('button'); okBtn.className = 'btn-primary'; okBtn.textContent = '确定'; okBtn.onclick = () => { const idx = parseInt(select.value); const groupName = groups[idx] ? groups[idx].name : '未分组'; overlay.remove(); callback(groupName); }; footer.appendChild(cancelBtn); footer.appendChild(okBtn); card.appendChild(footer); overlay.appendChild(card); document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); }); }

// ========== 全局字卡独立页面 ==========
function openGlobalCardsPage(fromPage) { _cardsFromPage = fromPage || 'me'; if (!appData.globalCardGroups.some(g => g.name === '未分组')) appData.globalCardGroups.push({ name: '未分组', list: [] }); globalViewMode = 'all'; document.getElementById('chatsPage').classList.remove('active'); document.getElementById('mePage').classList.remove('active'); document.getElementById('globalCardsPage').classList.add('active'); const body = document.getElementById('globalCardsPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const viewTabs = document.createElement('div'); viewTabs.className = 'view-tabs'; viewTabs.id = 'gViewTabs'; ['all', 'ungrouped', 'groups'].forEach(v => { const tab = document.createElement('span'); tab.className = 'view-tab' + (v === 'all' ? ' active' : ''); tab.dataset.view = v; tab.textContent = v === 'all' ? '全部' : (v === 'ungrouped' ? '未分组' : '选择分组'); tab.onclick = () => { globalViewMode = v; updateGlobalView(); }; viewTabs.appendChild(tab); }); body.appendChild(viewTabs); const combineRow = document.createElement('div'); combineRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;'; combineRow.innerHTML = `<span style="font-size:13px;">拼词条数：</span><input id="globalCombineMin" type="number" value="${appData.globalRule.combineMin || 1}" min="1" max="20" style="width:50px;padding:4px;border-radius:8px;border:1px solid var(--border-light);text-align:center;"><span style="font-size:13px;">~</span><input id="globalCombineMax" type="number" value="${appData.globalRule.combineMax || 3}" min="1" max="20" style="width:50px;padding:4px;border-radius:8px;border:1px solid var(--border-light);text-align:center;"><button class="btn" id="saveGlobalCombine">保存</button>`; body.appendChild(combineRow); setTimeout(() => { document.getElementById('saveGlobalCombine').onclick = () => { const minVal = parseInt(document.getElementById('globalCombineMin').value) || 1; const maxVal = parseInt(document.getElementById('globalCombineMax').value) || 3; appData.globalRule.combineMin = Math.max(1, Math.min(20, minVal)); appData.globalRule.combineMax = Math.max(appData.globalRule.combineMin, Math.min(20, maxVal)); markDataChanged(); save(); toast(`拼词条数设为 ${appData.globalRule.combineMin}~${appData.globalRule.combineMax} 条`); }; }, 100); const gsel = document.createElement('select'); gsel.id = 'gsel'; gsel.style.display = 'none'; body.appendChild(gsel); const searchRow = document.createElement('div'); searchRow.className = 'search-row'; const gsearch = document.createElement('input'); gsearch.id = 'gsearch'; gsearch.placeholder = '搜索...'; gsearch.oninput = () => updateGlobalView(); searchRow.appendChild(gsearch); const gsaLabel = document.createElement('label'); const gsa = document.createElement('input'); gsa.type = 'checkbox'; gsa.id = 'gsa'; gsaLabel.appendChild(gsa); gsaLabel.appendChild(document.createTextNode('全选')); searchRow.appendChild(gsaLabel); const gdisabledLabel = document.createElement('label'); gdisabledLabel.style.marginLeft = '8px'; const gdisabledOnly = document.createElement('input'); gdisabledOnly.type = 'checkbox'; gdisabledOnly.id = 'gdisabledOnly'; gdisabledOnly.onchange = () => updateGlobalView(); gdisabledLabel.appendChild(gdisabledOnly); gdisabledLabel.appendChild(document.createTextNode('仅禁用')); searchRow.appendChild(gdisabledLabel); const gcount = document.createElement('span'); gcount.id = 'glist_count'; gcount.style.cssText = 'font-size:12px;color:var(--text-secondary)'; gcount.textContent = '(0)'; searchRow.appendChild(gcount); body.appendChild(searchRow); const scrollBtns = document.createElement('div'); scrollBtns.style.cssText = 'display:flex;gap:4px'; const gScrollTop = document.createElement('button'); gScrollTop.className = 'btn'; gScrollTop.textContent = '▲ 顶部'; gScrollTop.onclick = () => document.getElementById('glist').scrollTop = 0; const gScrollBottom = document.createElement('button'); gScrollBottom.className = 'btn'; gScrollBottom.textContent = '▼ 底部'; gScrollBottom.onclick = () => document.getElementById('glist').scrollTop = document.getElementById('glist').scrollHeight; scrollBtns.appendChild(gScrollTop); scrollBtns.appendChild(gScrollBottom); body.appendChild(scrollBtns); const glist = document.createElement('div'); glist.id = 'glist'; glist.className = 'card-scroll-area'; glist.style.cssText = 'min-height: 30vh;'; body.appendChild(glist); const moveRow = document.createElement('div'); moveRow.style.cssText = 'display:flex;gap:6px'; const gmove = document.createElement('select'); gmove.id = 'gmove'; gmove.style.flex = '2'; const gmovebtn = document.createElement('button'); gmovebtn.className = 'btn'; gmovebtn.textContent = '移动选中'; gmovebtn.onclick = () => { moveSelectedCards(appData.globalCardGroups, "glist", gmove.value); updateGlobalView(); }; moveRow.appendChild(gmove); moveRow.appendChild(gmovebtn); body.appendChild(moveRow); const gbatchdel = document.createElement('button'); gbatchdel.className = 'batch-del-btn'; gbatchdel.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;'; gbatchdel.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('trash-2')}</svg>批量删除选中`; gbatchdel.onclick = () => { const cards = [...selectedCards]; if (!cards.length) { toast("请先选择字卡"); return; } showConfirm(`删除选中的 ${cards.length} 条字卡？`, () => { appData.globalCardGroups.forEach(g => g.list = g.list.filter(i => !cards.includes(i))); markDataChanged(); save(); selectedCards.clear(); updateGlobalView(); }); }; body.appendChild(gbatchdel); const gdisableBtn = document.createElement('button'); gdisableBtn.className = 'btn'; gdisableBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;color:#f44336;'; gdisableBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('slash')}</svg>禁用选中`; gdisableBtn.onclick = () => batchDisableSelected('glist', appData.globalCardGroups); body.appendChild(gdisableBtn); const gclearBtn = document.createElement('button'); gclearBtn.className = 'btn'; gclearBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;'; gclearBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('check')}</svg>解除全部禁用`; gclearBtn.onclick = () => { appData.disabledGlobalCards = []; markDataChanged(); save(); updateGlobalView(); }; body.appendChild(gclearBtn); const groupOps = document.createElement('div'); groupOps.style.cssText = 'display:flex;gap:6px;'; const gaddgrp = document.createElement('button'); gaddgrp.className = 'btn'; gaddgrp.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:4px;'; gaddgrp.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('plus')}</svg>分组`; gaddgrp.onclick = () => { showInputDialog('新建分组', '分组名', (name) => { if (name) { if (appData.globalCardGroups.some(g => g.name === name)) { toast('分组名已存在'); return; } appData.globalCardGroups.push({ name, list: [] }); markDataChanged(); save(); globalViewMode = 'groups'; updateGlobalView(); const idx = appData.globalCardGroups.length - 1; document.getElementById('gsel').value = idx; renderCardList('glist', appData.globalCardGroups, 'groups', idx, 'gsearch', 'gsa', appData.disabledGlobalCards, false); toast('分组已添加'); } else { toast('操作取消'); } }); }; const gdelgrp = document.createElement('button'); gdelgrp.className = 'btn'; gdelgrp.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:4px;color:#f44336;'; gdelgrp.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('minus')}</svg>分组`; gdelgrp.onclick = () => { if (globalViewMode !== 'groups') { toast("请先切换到选择分组"); return; } const i = parseInt(document.getElementById("gsel").value); if (isNaN(i) || !appData.globalCardGroups[i]) { toast('请选择要删除的分组'); return; } const groupName = appData.globalCardGroups[i].name; if (groupName === '未分组') { toast('系统默认分组不可删除'); return; } showConfirm("删除分组？", () => { appData.globalCardGroups.splice(i, 1); markDataChanged(); save(); updateGlobalView(); toast(`分组"${groupName}"已删除`); }); }; const grenamegrp = document.createElement('button'); grenamegrp.className = 'btn'; grenamegrp.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:4px;'; grenamegrp.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('edit-3')}</svg>改名`; grenamegrp.onclick = () => { if (globalViewMode !== 'groups') { toast("请先切换到选择分组"); return; } const i = parseInt(document.getElementById("gsel").value); if (isNaN(i) || !appData.globalCardGroups[i]) { toast('请选择要改名的分组'); return; } const oldName = appData.globalCardGroups[i].name; if (oldName === '未分组') { toast('系统默认分组不可改名'); return; } showInputDialog('修改分组名', oldName, (newName) => { if (newName && newName !== oldName) { appData.globalCardGroups[i].name = newName; markDataChanged(); save(); updateGlobalView(); toast('分组已改名'); } }); }; const gimporttxt = document.createElement('button'); gimporttxt.className = 'btn'; gimporttxt.style.flex = '1'; gimporttxt.textContent = '粘贴导入'; gimporttxt.onclick = () => { showGroupSelectDialog(appData.globalCardGroups, (targetGroup) => { showInputDialogRaw('粘贴字卡', '每行一条', (text) => { if (!text || !text.trim()) { toast('未输入内容'); return; } const lines = uniqueArr(text.split('\n').map(s => sanitizeText(s, true))); if (lines.length === 0) { toast('未识别到有效字卡'); return; } importCardsToGlobal(lines, targetGroup); if (document.getElementById('globalCardsPage').classList.contains('active')) updateGlobalView(); }); }); }; const gimportfile = document.createElement('button'); gimportfile.className = 'btn'; gimportfile.style.flex = '1'; gimportfile.textContent = '文件导入'; gimportfile.onclick = () => { showGroupSelectDialog(appData.globalCardGroups, (targetGroup) => { const fileInput = document.getElementById("globalBatchFileInput"); fileInput._targetGroup = targetGroup; fileInput.click(); }); }; groupOps.appendChild(gaddgrp); groupOps.appendChild(gdelgrp); groupOps.appendChild(grenamegrp); groupOps.appendChild(gimporttxt); groupOps.appendChild(gimportfile); body.appendChild(groupOps); const ruleTitle = document.createElement('h4'); ruleTitle.textContent = '回复速度'; body.appendChild(ruleTitle); const ruleRow = document.createElement('div'); ruleRow.style.cssText = 'display:flex;gap:6px;'; const gmin = document.createElement('input'); gmin.type = 'number'; gmin.className = 'compact-input'; gmin.id = 'gmin'; gmin.value = appData.globalRule.min; const gmax = document.createElement('input'); gmax.type = 'number'; gmax.className = 'compact-input'; gmax.id = 'gmax'; gmax.value = appData.globalRule.max; const gcntmin = document.createElement('input'); gcntmin.type = 'number'; gcntmin.className = 'compact-input'; gcntmin.id = 'gcntmin'; gcntmin.value = appData.globalRule.cntMin; const gcntmax = document.createElement('input'); gcntmax.type = 'number'; gcntmax.className = 'compact-input'; gcntmax.id = 'gcntmax'; gcntmax.value = appData.globalRule.cntMax; ruleRow.appendChild(gmin); ruleRow.appendChild(gmax); ruleRow.appendChild(gcntmin); ruleRow.appendChild(gcntmax); body.appendChild(ruleRow); const gsave = document.createElement('button'); gsave.className = 'btn btn-primary'; gsave.textContent = '保存'; gsave.onclick = () => { appData.globalRule = { min: parseInt(gmin.value) || 30, max: parseInt(gmax.value) || 60, cntMin: parseInt(gcntmin.value) || 3, cntMax: parseInt(gcntmax.value) || 5 }; markDataChanged(); save(); toast('已保存'); }; body.appendChild(gsave); const batchBtn = document.createElement('button'); batchBtn.className = 'btn'; batchBtn.style.cssText = 'margin-top:6px;display:flex;align-items:center;justify-content:center;gap:4px;'; batchBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('copy')}</svg>批量应用到所有梦角`; batchBtn.onclick = () => { const min = parseInt(document.getElementById('gmin').value) || 30; const max = parseInt(document.getElementById('gmax').value) || 60; const cntMin = parseInt(document.getElementById('gcntmin').value) || 3; const cntMax = parseInt(document.getElementById('gcntmax').value) || 5; let count = 0; appData.users.forEach(u => { if (!u.members) { u.rule = { min, max, cntMin, cntMax }; count++; } }); markDataChanged(); save(); toast(`已批量更新 ${count} 个梦角的回复速度`); }; body.appendChild(batchBtn); updateGlobalView(); }
function updateGlobalView() { const g = appData.globalCardGroups, m = globalViewMode; const disabledOnly = document.getElementById('gdisabledOnly')?.checked || false; document.querySelectorAll("#gViewTabs .view-tab").forEach(tab => tab.classList.toggle('active', tab.dataset.view === m)); const s = document.getElementById("gsel"); const prevIdx = s && s.style.display !== 'none' ? parseInt(s.value) || 0 : 0; if (m === 'groups') { s.style.display = 'block'; while (s.firstChild) s.removeChild(s.firstChild); g.forEach((grp, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = grp.name + ' (' + grp.list.length + ')'; s.appendChild(opt); }); const idx = g[prevIdx] ? prevIdx : 0; s.value = idx; renderCardList("glist", g, m, idx, "gsearch", "gsa", appData.disabledGlobalCards, disabledOnly); s.onchange = () => renderCardList("glist", g, m, parseInt(s.value), "gsearch", "gsa", appData.disabledGlobalCards, disabledOnly); } else { s.style.display = 'none'; renderCardList("glist", g, m, null, "gsearch", "gsa", appData.disabledGlobalCards, disabledOnly); } const gmove = document.getElementById("gmove"); while (gmove.firstChild) gmove.removeChild(gmove.firstChild); g.forEach(grp => { const opt = document.createElement('option'); opt.value = grp.name; opt.textContent = grp.name; gmove.appendChild(opt); }); }

function openUserCardsPage(userId, fromPage) { const u = getContact(userId); if (!u || u.id === 'me') return; _cardsFromPage = fromPage || 'contact'; window._currentCardsUserId = userId; window.tempUser = u; if (!u.cardGroups || u.cardGroups.length === 0) u.cardGroups = [{ name: '未分组', list: [] }]; if (!u.cardGroups.some(g => g.name === '未分组')) u.cardGroups.unshift({ name: '未分组', list: [] }); userViewMode = 'all'; document.getElementById('chatsPage').classList.remove('active'); document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('userCardsPage').classList.add('active'); document.getElementById('userCardsBackBtn').onclick = () => { document.getElementById('userCardsPage').classList.remove('active'); if (_cardsFromPage === 'chat') { document.getElementById('chatPage').classList.add('active'); } else { document.getElementById('chatsPage').classList.add('active'); renderChatList(); } }; const body = document.getElementById('userCardsPageContent'); while (body.firstChild) body.removeChild(body.firstChild); const viewTabs = document.createElement('div'); viewTabs.className = 'view-tabs'; viewTabs.id = 'uViewTabs'; ['all', 'ungrouped', 'groups'].forEach(v => { const tab = document.createElement('span'); tab.className = 'view-tab' + (v === 'all' ? ' active' : ''); tab.dataset.view = v; tab.textContent = v === 'all' ? '全部' : (v === 'ungrouped' ? '未分组' : '选择分组'); tab.onclick = () => { userViewMode = v; updateUserView(); }; viewTabs.appendChild(tab); }); body.appendChild(viewTabs); const sel = document.createElement('select'); sel.id = 'usel'; sel.style.display = 'none'; body.appendChild(sel); const searchOuter = document.createElement('div'); searchOuter.className = 'card-search-row'; const ucountSpan = document.createElement('span'); ucountSpan.id = 'ucount'; ucountSpan.style.cssText = 'font-size:12px;color:var(--text-secondary);margin-left:8px;'; ucountSpan.textContent = '(0)'; const searchInput = document.createElement('input'); searchInput.id = 'usearch'; searchInput.placeholder = '搜索...'; searchInput.style.cssText = 'flex:1; max-width:60%; padding:6px 10px; border-radius:15px; border:1px solid var(--border-light); background:var(--primary-bg); font-size:13px;'; searchInput.oninput = () => updateUserView(); searchOuter.appendChild(searchInput); searchOuter.appendChild(ucountSpan); const verticalChecks = document.createElement('div'); verticalChecks.className = 'vertical-checks'; const usaLabel = document.createElement('label'); const usaCheck = document.createElement('input'); usaCheck.type = 'checkbox'; usaCheck.id = 'usa'; usaLabel.appendChild(usaCheck); usaLabel.appendChild(document.createTextNode('全选')); const disabledOnlyLabel = document.createElement('label'); const disabledOnlyCheck = document.createElement('input'); disabledOnlyCheck.type = 'checkbox'; disabledOnlyCheck.id = 'udisabledOnly'; disabledOnlyCheck.onchange = () => updateUserView(); disabledOnlyLabel.appendChild(disabledOnlyCheck); disabledOnlyLabel.appendChild(document.createTextNode('仅禁用')); verticalChecks.appendChild(usaLabel); verticalChecks.appendChild(disabledOnlyLabel); searchOuter.appendChild(verticalChecks); body.appendChild(searchOuter); const navBtns = document.createElement('div'); navBtns.className = 'card-nav-btns'; const scrollTopBtn = document.createElement('button'); scrollTopBtn.className = 'btn'; scrollTopBtn.textContent = '▲ 顶部'; scrollTopBtn.onclick = () => document.getElementById('ulist').scrollTop = 0; const scrollBottomBtn = document.createElement('button'); scrollBottomBtn.className = 'btn'; scrollBottomBtn.textContent = '▼ 底部'; scrollBottomBtn.onclick = () => document.getElementById('ulist').scrollTop = document.getElementById('ulist').scrollHeight; navBtns.appendChild(scrollTopBtn); navBtns.appendChild(scrollBottomBtn); body.appendChild(navBtns); const ulist = document.createElement('div'); ulist.id = 'ulist'; ulist.className = 'card-scroll-area'; ulist.style.maxHeight = '50vh'; body.appendChild(ulist); const moveRow = document.createElement('div'); moveRow.style.cssText = 'display:flex;gap:6px'; const umove = document.createElement('select'); umove.id = 'umove'; umove.style.flex = '1'; const umoveBtn = document.createElement('button'); umoveBtn.className = 'btn'; umoveBtn.id = 'umovebtn'; umoveBtn.textContent = '移动'; umoveBtn.onclick = () => { moveSelectedCards(u.cardGroups, "ulist", umove.value); updateUserView(); }; moveRow.appendChild(umove); moveRow.appendChild(umoveBtn); body.appendChild(moveRow); const batchDelBtn = document.createElement('button'); batchDelBtn.className = 'batch-del-btn'; batchDelBtn.id = 'ubatchdel'; batchDelBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;'; batchDelBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('trash-2')}</svg>批量删除`; batchDelBtn.onclick = () => { const cards = [...selectedCards]; if (!cards.length) { toast("请先选择字卡"); return; } showConfirm(`删除选中的 ${cards.length} 条字卡？`, () => { u.cardGroups.forEach(g => g.list = g.list.filter(i => !cards.includes(i))); markDataChanged(); save(); selectedCards.clear(); updateUserView(); }); }; body.appendChild(batchDelBtn); const disableSelectedBtn = document.createElement('button'); disableSelectedBtn.className = 'btn'; disableSelectedBtn.id = 'udisableSelectedBtn'; disableSelectedBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;color:#f44336;'; disableSelectedBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('slash')}</svg>禁用选中`; disableSelectedBtn.onclick = () => batchDisableSelected('ulist', u.cardGroups); body.appendChild(disableSelectedBtn); const clearDisabledBtn = document.createElement('button'); clearDisabledBtn.className = 'btn'; clearDisabledBtn.id = 'uclearDisabledBtn'; clearDisabledBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;'; clearDisabledBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('check')}</svg>解除全部禁用`; clearDisabledBtn.onclick = () => { appData.disabledUserCards[u.id] = []; markDataChanged(); save(); updateUserView(); }; body.appendChild(clearDisabledBtn); const groupOps = document.createElement('div'); groupOps.style.cssText = 'display:flex;gap:4px;'; const addGrpBtn = document.createElement('button'); addGrpBtn.className = 'btn'; addGrpBtn.id = 'uaddgrp'; addGrpBtn.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:4px;'; addGrpBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('plus')}</svg>分组`; addGrpBtn.onclick = () => { showInputDialog('新建分组', '分组名', (name) => { if (name) { if (u.cardGroups.some(g => g.name === name)) { toast('分组名已存在'); return; } u.cardGroups.push({ name, list: [] }); markDataChanged(); save(); userViewMode = 'groups'; updateUserView(); const idx = u.cardGroups.length - 1; document.getElementById('usel').value = idx; renderCardList('ulist', u.cardGroups, 'groups', idx, 'usearch', 'usa', appData.disabledUserCards[u.id] || [], false); toast('分组已添加'); } else { toast('操作取消'); } }); }; const delGrpBtn = document.createElement('button'); delGrpBtn.className = 'btn'; delGrpBtn.id = 'udelgrp'; delGrpBtn.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:4px;color:#f44336;'; delGrpBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('minus')}</svg>分组`; delGrpBtn.onclick = () => { if (userViewMode !== 'groups') { toast("先选分组"); return; } const i = parseInt(document.getElementById("usel").value); if (isNaN(i) || !u.cardGroups[i]) { toast('请选择分组'); return; } const gname = u.cardGroups[i].name; if (gname === '未分组') { toast('系统默认分组不可删除'); return; } showConfirm('删除分组？', () => { u.cardGroups.splice(i, 1); markDataChanged(); save(); updateUserView(); toast(`分组"${gname}"已删除`); }); }; const renameGrpBtn = document.createElement('button'); renameGrpBtn.className = 'btn'; renameGrpBtn.id = 'urenamegrp'; renameGrpBtn.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;gap:4px;'; renameGrpBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('edit-3')}</svg>改名`; renameGrpBtn.onclick = () => { if (userViewMode !== 'groups') { toast("先选分组"); return; } const i = parseInt(document.getElementById("usel").value); if (isNaN(i) || !u.cardGroups[i]) { toast('请选择分组'); return; } const oldName = u.cardGroups[i].name; if (oldName === '未分组') { toast('系统默认分组不可改名'); return; } showInputDialog('修改分组名', oldName, (newName) => { if (newName && newName !== oldName) { u.cardGroups[i].name = newName; markDataChanged(); save(); updateUserView(); toast('分组已改名'); } }); }; const importTxtBtn = document.createElement('button'); importTxtBtn.className = 'btn'; importTxtBtn.id = 'uimporttxt'; importTxtBtn.textContent = '粘贴导入'; importTxtBtn.style.flex = '1'; importTxtBtn.onclick = () => { showGroupSelectDialog(u.cardGroups, (targetGroup) => { showInputDialogRaw('粘贴字卡', '每行一条', (text) => { if (!text || !text.trim()) { toast('未输入内容'); return; } const lines = uniqueArr(text.split('\n').map(s => sanitizeText(s, true))); if (lines.length === 0) { toast('未识别到有效字卡'); return; } importUserCards(u, lines, targetGroup); if (document.getElementById('userCardsPage').classList.contains('active')) updateUserView(); }); }); }; const importFileBtn = document.createElement('button'); importFileBtn.className = 'btn'; importFileBtn.id = 'uimportfile'; importFileBtn.textContent = '文件导入'; importFileBtn.style.flex = '1'; importFileBtn.onclick = () => { showGroupSelectDialog(u.cardGroups, (targetGroup) => { const fileInput = document.getElementById("userBatchFileInput"); fileInput._targetGroup = targetGroup; fileInput._targetUser = u; fileInput.click(); }); }; groupOps.appendChild(addGrpBtn); groupOps.appendChild(delGrpBtn); groupOps.appendChild(renameGrpBtn); groupOps.appendChild(importTxtBtn); groupOps.appendChild(importFileBtn); body.appendChild(groupOps); updateUserView(); }
function updateUserView() { const u = window.tempUser || (currentChatId === 'me' ? appData.myProfile : appData.users.find(x => x.id === (window._currentCardsUserId || currentChatId))); if (!u || u.id === 'me') return; const g = u.cardGroups || [], m = userViewMode; const disabledOnly = document.getElementById('udisabledOnly')?.checked || false; document.querySelectorAll("#uViewTabs .view-tab").forEach(t => t.classList.toggle('active', t.dataset.view === m)); const s = document.getElementById("usel"); const prevIdx = s && s.style.display !== 'none' ? parseInt(s.value) || 0 : 0; const disabled = appData.disabledUserCards[u.id] || []; if (m === 'groups') { s.style.display = 'block'; while (s.firstChild) s.removeChild(s.firstChild); g.forEach((grp, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = grp.name + ' (' + grp.list.length + ')'; s.appendChild(opt); }); const idx = g[prevIdx] ? prevIdx : 0; s.value = idx; renderCardList("ulist", g, m, idx, "usearch", "usa", disabled, disabledOnly); s.onchange = () => renderCardList("ulist", g, m, parseInt(s.value), "usearch", "usa", disabled, disabledOnly); } else { s.style.display = 'none'; renderCardList("ulist", g, m, null, "usearch", "usa", disabled, disabledOnly); } const umove = document.getElementById("umove"); while (umove.firstChild) umove.removeChild(umove.firstChild); g.forEach(grp => { const opt = document.createElement('option'); opt.value = grp.name; opt.textContent = grp.name; umove.appendChild(opt); }); const ucountSpan = document.getElementById('ucount'); if (ucountSpan) { const allCards = u.cardGroups.flatMap(g => g.list); let count = 0; if (userViewMode === 'all') { count = allCards.length; } else if (userViewMode === 'ungrouped') { const ungrouped = u.cardGroups.find(g => g.name === '未分组'); count = ungrouped ? ungrouped.list.length : 0; } ucountSpan.textContent = '(' + count + ')'; } }

// ========== 备份系统 ==========
function createBackupFloatElements() { backupFloatBall = document.createElement('div'); backupFloatBall.className = 'backup-float-ball'; backupFloatBall.id = 'backupFloatBall'; backupFloatBall.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'; backupFloatBall.style.bottom = '80px'; backupFloatBall.style.right = '16px'; document.body.appendChild(backupFloatBall); backupFloatPanel = document.createElement('div'); backupFloatPanel.className = 'backup-float-panel'; backupFloatPanel.innerHTML = `<button class="btn" id="backupCompactBtn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:4px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('archive')}</svg>精简备份</button>`; backupFloatPanel.style.bottom = 'auto'; backupFloatPanel.style.right = 'auto'; backupFloatPanel.style.display = 'none'; document.body.appendChild(backupFloatPanel); document.getElementById('backupCompactBtn').onclick = () => { performCompactBackup(); }; let dragOff = null; backupFloatBall.addEventListener('pointerdown', (e) => { e.preventDefault(); dragOff = { x: e.clientX - backupFloatBall.offsetLeft, y: e.clientY - backupFloatBall.offsetTop }; backupFloatBall.setPointerCapture(e.pointerId); const move = (ev) => { backupFloatBall.style.left = (ev.clientX - dragOff.x) + 'px'; backupFloatBall.style.top = (ev.clientY - dragOff.y) + 'px'; backupFloatBall.style.right = 'auto'; backupFloatBall.style.bottom = 'auto'; }; const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); const rect = backupFloatBall.getBoundingClientRect(); const minVisible = 20; if (rect.left < -(55 - minVisible)) backupFloatBall.style.left = -(55 - minVisible) + 'px'; if (rect.right > window.innerWidth + (55 - minVisible)) backupFloatBall.style.left = (window.innerWidth - minVisible) + 'px'; if (rect.top < -(55 - minVisible)) backupFloatBall.style.top = -(55 - minVisible) + 'px'; if (rect.bottom > window.innerHeight + (55 - minVisible)) backupFloatBall.style.top = (window.innerHeight - minVisible) + 'px'; }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); }); }
function toggleBackupFloat() { backupFloatVisible = !backupFloatVisible; if (backupFloatVisible) { backupFloatBall.style.display = 'flex'; backupFloatBall.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12l4 4v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"/><rect x="6" y="2" width="12" height="6" rx="1"/><rect x="8" y="12" width="8" height="4" rx="0.5"/></svg>'; backupFloatPanel.style.display = 'none'; setTimeout(positionFloatBalls, 100); } else { backupFloatBall.style.display = 'none'; backupFloatPanel.style.display = 'none'; } backupFloatBall.onclick = () => { const ballRect = backupFloatBall.getBoundingClientRect(); backupFloatPanel.style.left = (ballRect.right + 8) + 'px'; backupFloatPanel.style.top = (ballRect.top - 8) + 'px'; backupFloatPanel.style.right = 'auto'; backupFloatPanel.style.bottom = 'auto'; if (backupFloatPanel.style.display === 'none') backupFloatPanel.style.display = 'flex'; else backupFloatPanel.style.display = 'none'; }; }
function downloadBackupBlob(blob, label, dateStr, timeStr, ext = 'json') { if (!dateStr) { const now = new Date(); dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`; } const fileName = `默_${label}_${dateStr} ${timeStr}.${ext}`; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; a.click(); URL.revokeObjectURL(url); const toastElement = document.getElementById('toast'); toastElement.textContent = label === 'auto' ? '自动备份完成（点此下载，30秒后消失）' : '点击下载备份（30秒后消失）'; toastElement.classList.add('show'); toastElement.style.pointerEvents = 'auto'; toastElement.onclick = () => { const url2 = URL.createObjectURL(blob); const a2 = document.createElement('a'); a2.href = url2; a2.download = fileName; a2.click(); URL.revokeObjectURL(url2); toastElement.classList.remove('show'); toastElement.style.pointerEvents = 'none'; }; clearTimeout(toastElement._tt); toastElement._tt = setTimeout(() => { toastElement.classList.remove('show'); toastElement.style.pointerEvents = 'none'; }, 30000); }function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function performBackup(silent = false, labelOverride = null) { if (!silent) { toast('正在备份，请稍候...', 0); } const backupBtns = document.querySelectorAll('#backupTriggerBtn, #backupGlobalBtn, #backupCompactBtn, .backup-float-ball'); backupBtns.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.5'; btn.style.pointerEvents = 'none'; }); const toolBtn = document.getElementById('backupTriggerBtn'); if (toolBtn) toolBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'; if (backupInProgress && (!backupLockTimer || Date.now() - backupLockTimer > 5000)) { backupInProgress = false; backupLockTimer = null; } if (backupInProgress) return false; backupInProgress = true; backupLockTimer = Date.now(); try { const now = new Date(); const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; const timeStr = `${String(now.getHours()).padStart(2, '0')} ${String(now.getMinutes()).padStart(2, '0')} ${String(now.getSeconds()).padStart(2, '0')}`; const [coreData, msgData] = await Promise.all([loadFromDB('appData_core'), loadFromDB('appData_msg')]); const backupData = { ...coreData, msg: msgData }; for (const chatId in backupData.msg) { const msgs = backupData.msg[chatId] || []; for (const m of msgs) { if (m.image && typeof m.image === 'string' && m.image.startsWith('img_')) { try { const base64 = await loadMedia(m.image); if (base64) m.image = base64; } catch (e) {} } if (m.voice && typeof m.voice === 'string' && m.voice.startsWith('voice_')) { try { const base64 = await loadMedia(m.voice); if (base64) m.voice = base64; } catch (e) {} } } } if (typeof JSZip === 'undefined') { const fallbackData = JSON.parse(JSON.stringify(backupData)); const blob = new Blob([JSON.stringify(fallbackData, null, 2)], { type: 'application/json' }); const realUsers = appData.users.filter(u => !u.members); const onlyUser = (realUsers.length === 1) ? realUsers[0].name : null; const backupLabel = labelOverride ? (onlyUser ? onlyUser + '_' + labelOverride : labelOverride) : (onlyUser ? onlyUser + '_' : '') + (silent ? 'auto' : 'backup'); downloadBackupBlob(blob, backupLabel, dateStr, timeStr); return true; } const zip = new JSZip(); zip.file('backup.json', JSON.stringify(backupData, null, 2)); const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }); const realUsers = appData.users.filter(u => !u.members); const onlyUser = (realUsers.length === 1) ? realUsers[0].name : null; const backupLabel = labelOverride ? (onlyUser ? onlyUser + '_' + labelOverride : labelOverride) : (onlyUser ? onlyUser + '_' : '') + (silent ? 'auto' : 'backup'); downloadBackupBlob(zipBlob, backupLabel, dateStr, timeStr, 'zip'); appData.dataChanged = false; appData.lastBackupTime = Date.now(); backupInProgress = false; backupLockTimer = null; const backupBtns2 = document.querySelectorAll('#backupTriggerBtn, #backupGlobalBtn, #backupCompactBtn, .backup-float-ball'); backupBtns2.forEach(btn => { btn.disabled = false; btn.style.opacity = ''; btn.style.pointerEvents = ''; }); const toolBtn2 = document.getElementById('backupTriggerBtn'); if (toolBtn2) toolBtn2.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12l4 4v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"/><rect x="6" y="2" width="12" height="6" rx="1"/><rect x="8" y="12" width="8" height="4" rx="0.5"/></svg>'; document.getElementById('toast').classList.remove('show'); if (!silent) { toast('备份完成，文件已下载', 2500); } return true; } catch (e) { backupInProgress = false; backupLockTimer = null; const backupBtns3 = document.querySelectorAll('#backupTriggerBtn, #backupGlobalBtn, #backupCompactBtn, .backup-float-ball'); backupBtns3.forEach(btn => { btn.disabled = false; btn.style.opacity = ''; btn.style.pointerEvents = ''; }); const toolBtn3 = document.getElementById('backupTriggerBtn'); if (toolBtn3) toolBtn3.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h12l4 4v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"/><rect x="6" y="2" width="12" height="6" rx="1"/><rect x="8" y="12" width="8" height="4" rx="0.5"/></svg>'; document.getElementById('toast').classList.remove('show'); const nowToast = Date.now(); if (!performBackup._lastFailToast || nowToast - performBackup._lastFailToast > 30000) { performBackup._lastFailToast = nowToast; showConfirm('备份失败，数据过大。建议清理旧聊天记录后重试。', () => {}); } return false; } }
async function performCompactBackup() { toast('正在生成精简备份...', 0); const result = await performBackup(true, 'compact'); document.getElementById('toast').classList.remove('show'); if (result) { toast('精简备份完成', 2000); } return result; }
function startAutoBackup() { stopAutoBackup(); if (!appData.autoBackupEnabled) return; autoBackupTimer = setInterval(() => { if (!appData.autoBackupEnabled) { stopAutoBackup(); return; } const interval = (appData.autoBackupIntervalSecs || 60) * 1000; if (appData.dataChanged && Date.now() - appData.lastBackupTime >= interval) { performBackup(true); } }, 1000); }
function stopAutoBackup() { if (autoBackupTimer) { clearTimeout(autoBackupTimer); autoBackupTimer = null; } }
function startSaveReminder() { stopSaveReminder(); saveReminderTimer = setInterval(() => { toast('建议备份数据，防止丢失', 3000); }, 1200000); }
function stopSaveReminder() { if (saveReminderTimer) { clearInterval(saveReminderTimer); saveReminderTimer = null; } }

document.addEventListener('visibilitychange', () => { if (document.hidden) { if (autoBackupTimer) { clearInterval(autoBackupTimer); autoBackupTimer = null; } if (saveReminderTimer) { clearInterval(saveReminderTimer); saveReminderTimer = null; } pageHiddenTimersPaused = true; } else { pageHiddenTimersPaused = false; if (appData.autoBackupEnabled && !autoBackupTimer) startAutoBackup(); if (!saveReminderTimer) startSaveReminder(); if (appData.autoBackupEnabled && appData.dataChanged && Date.now() - appData.lastBackupTime >= (appData.autoBackupIntervalSecs || 60) * 1000) { performBackup(true); } } });
window.addEventListener('beforeunload', (e) => { e.preventDefault(); e.returnValue = '你确定要离开吗？数据可能丢失。'; return e.returnValue; });

// ========== 模拟朋友圈数据 ==========
    function resetDailyCommentCounts(){ const today = new Date().toDateString(); if(appData.dailyReset !== today){ appData.userDailyCommentCount = {}; appData.dailyReset = today; } }
    function simulateUserMomentComments(){ setInterval(() => { resetDailyCommentCounts(); const myMoments = appData.moments['me'] || []; const recent = myMoments.filter(m => new Date() - new Date(m.time) < 24*3600000); if(!recent.length) return; const targetMoment = recent[Math.floor(Math.random()*recent.length)]; const targetComments = targetMoment.comments||[]; const user = appData.users[Math.floor(Math.random()*appData.users.length)]; if(!user) return; const userCommentsOnMoment = targetComments.filter(c=>c.name===user.name).length; if(userCommentsOnMoment >= 3) return; if((appData.userDailyCommentCount[user.id]||0) >= 10) return; if(Math.random() > 0.4) return; const pool = getCardPool(user.id, false, true); const commentText = pool.length ? pool[Math.floor(Math.random()*pool.length)] : '很有趣'; targetMoment.comments.push({name:user.name, userId:user.id, text: commentText, time: new Date().toISOString()}); appData.userDailyCommentCount[user.id] = (appData.userDailyCommentCount[user.id]||0)+1; markDataChanged(); save(); if(document.getElementById('momentsPage').classList.contains('active') && currentMomentUserId==='me') renderMomentsList(); }, 300000); }
    function simulateUserOwnComments(){ setInterval(() => { appData.users.forEach(user => { const ownMoments = appData.moments[user.id] || []; const recent = ownMoments.filter(m => new Date() - new Date(m.time) < 24*3600000); if(!recent.length) return; const target = recent[Math.floor(Math.random()*recent.length)]; const targetComments = target.comments||[]; const userSelfComments = targetComments.filter(c=>c.name===user.name).length; if(userSelfComments >= 3) return; if(Math.random() > 0.3) return; const pool = getCardPool(user.id, false, true); const commentText = pool.length ? pool[Math.floor(Math.random()*pool.length)] : '不错呀'; target.comments.push({name:user.name, userId:user.id, text: commentText, time: new Date().toISOString()}); markDataChanged(); save(); if(document.getElementById('momentsPage').classList.contains('active') && currentMomentUserId===user.id) renderMomentsList(); }); }, 600000); }
    function simulateUserMomentLikes(){ setInterval(() => { const myMoments = appData.moments['me'] || []; const recent = myMoments.filter(m => new Date() - new Date(m.time) < 24*3600000); if(recent.length){ const target = recent[Math.floor(Math.random()*recent.length)]; if(Math.random() > 0.5) return; const user = appData.users[Math.floor(Math.random()*appData.users.length)]; if(!user || (target.likedBy||[]).includes(user.id)) return; target.likes = (target.likes||0)+1; if(!target.likedBy) target.likedBy = []; target.likedBy.push(user.id); markDataChanged(); save(); if(document.getElementById('momentsPage').classList.contains('active') && currentMomentUserId==='me') renderMomentsList(); } appData.users.forEach(user => { const ownMoments = appData.moments[user.id] || []; const recent = ownMoments.filter(m => new Date() - new Date(m.time) < 24*3600000); if(!recent.length) return; const target = recent[Math.floor(Math.random()*recent.length)]; if(Math.random() > 0.3) return; if((target.likedBy||[]).includes(user.id)) return; target.likes = (target.likes||0)+1; if(!target.likedBy) target.likedBy = []; target.likedBy.push(user.id); markDataChanged(); save(); if(document.getElementById('momentsPage').classList.contains('active') && currentMomentUserId===user.id) renderMomentsList(); }); }, 600000); }
    function simulateUserMoments(){
    // 随机调度下一次发动态的时间，避免机械刷屏
    function scheduleNext(){
        // 随机间隔：30分钟到4小时之间
        const minDelay = 30 * 60 * 1000;
        const maxDelay = 4 * 60 * 60 * 1000;
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        setTimeout(simulateUserMoments, delay);
    }

    // 今天的日期
    const today = new Date().toDateString();
    
    // 初始化或重置每日计数
    if (!appData.dailyMomentCount) appData.dailyMomentCount = {};
    if (!appData.dailyMomentDate) appData.dailyMomentDate = today;
    if (appData.dailyMomentDate !== today) {
        appData.dailyMomentCount = {};
        appData.dailyMomentDate = today;
    }

    // 筛选出今天发动态数还没到5条的MJ
    const availableUsers = appData.users.filter(u => {
        if (!u || u.members) return false; // 跳过群聊和无效用户
        const count = appData.dailyMomentCount[u.id] || 0;
        return count < 5;
    });

    if (availableUsers.length === 0) {
        scheduleNext();
        return;
    }

    // 随机选一个MJ
    const user = availableUsers[Math.floor(Math.random() * availableUsers.length)];
    
    // 随机决定这次发1-5条（但不超过当天剩余额度）
    const remainingQuota = 5 - (appData.dailyMomentCount[user.id] || 0);
    const countToSend = Math.min(
        1 + Math.floor(Math.random() * 5), // 随机1-5条
        remainingQuota                     // 不能超过剩余额度
    );

    // 准备发圈
    const pool = getCardPool(user.id, false, true).filter(c => !appData.disabledGlobalCards.includes(c));
    if (!appData.moments[user.id]) appData.moments[user.id] = [];

    for (let i = 0; i < countToSend; i++) {
        const text = pool.length ? pool[Math.floor(Math.random() * pool.length)] : '今天天气真好';
        const imgs = [];
        if (Math.random() < 0.3) {
            const em = getAllUserEmojis();
            if (em.length) imgs.push(em[Math.floor(Math.random() * em.length)]);
        }
        
        appData.moments[user.id].unshift({
            name: user.name, avatar: user.avt, status: user.status || '在线',
            text, images: imgs, time: new Date().toISOString(),
            likes: 0, likedBy: [], comments: []
        });
    }

    // 更新计数（只记录今天新增的动态，系统初始化的那些不算在内）
    appData.dailyMomentCount[user.id] = (appData.dailyMomentCount[user.id] || 0) + countToSend;
    markDataChanged(); save();

    // 如果当前正在查看这个MJ的朋友圈，刷新界面
    if (document.getElementById('momentsPage').classList.contains('active') && currentMomentUserId === user.id) {
        renderMomentsList();
    }

    // 安排下一次执行
    scheduleNext();
}

function openDatingPage() {
    hideAllPages();
    document.getElementById('datingPage').classList.add('active');
    renderDatingPage();
}

function renderDatingPage() {
    const body = document.getElementById('datingPageContent');
    body.innerHTML = '';
    const contacts = appData.users.filter(u => !u.members);
    if (contacts.length === 0) { body.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:20px;">请先添加好友</div>'; return; }
    if (contacts.length === 1) { renderDatingItemList(contacts[0].id); }
    else {
        contacts.forEach(contact => {
            const item = document.createElement('div'); item.className = 'chat-item'; item.style.cursor = 'pointer';
            item.innerHTML = `<div class="avatar">${contact.avt ? `<img src="${contact.avt}">` : contact.name[0]}</div><div class="info"><div class="name">${contact.name}</div></div>`;
            item.onclick = () => renderDatingItemList(contact.id);
            body.appendChild(item);
        });
    }
}

function renderDatingItemList(userId) {
    const body = document.getElementById('datingPageContent');
    body.innerHTML = '';
    
    // 五子棋入口
    const item = document.createElement('div'); item.className = 'chat-item'; item.style.cssText = 'cursor:pointer;';
    item.innerHTML = `<div class="avatar" style="background:var(--theme-light);display:flex;align-items:center;justify-content:center;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--theme)" stroke-width="2">${getIconSVG('grid')}</svg></div><div class="info"><div class="name">五子棋</div><div class="preview">经典五子棋，和梦角对弈</div></div>`;
    item.onclick = () => { window.openGomokuPage(userId); };
    body.appendChild(item);

    // 围棋入口
    const goItem = document.createElement('div');
    goItem.className = 'chat-item';
    goItem.style.cssText = 'cursor:pointer;';
    goItem.innerHTML = `
        <div class="avatar" style="background:var(--theme-light);display:flex;align-items:center;justify-content:center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--theme)" stroke-width="2">
                ${getIconSVG('grid')}
            </svg>
        </div>
        <div class="info">
            <div class="name">围棋</div>
            <div class="preview">传统围棋，和梦角对弈</div>
        </div>
    `;
    goItem.onclick = () => { window.openGoPage(userId); };
    body.appendChild(goItem);
}
// ========== 事件绑定 ==========
function bindEvents() { createMusicFloatElements(); createBackupFloatElements(); document.getElementById('chatBackBtn').onclick = () => { switchToChatsTab(); renderChatList(); }; document.getElementById('sendMsgBtn').onclick = () => sendMessage(); document.getElementById('messageInput').addEventListener('keypress', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }); document.getElementById('emojiTriggerBtn').onclick = () => { const ep = document.getElementById('emojiPanel'); const ip = document.getElementById('imagePanel'); ep.classList.toggle('show'); ip.classList.remove('show'); ep.classList.add('active-panel'); ip.classList.remove('active-panel'); }; document.getElementById('imageUploadBtn').onclick = () => { if (!currentChatId) { toast('请先选择联系人'); return; } const ip = document.getElementById('imagePanel'); const ep = document.getElementById('emojiPanel'); ip.classList.toggle('show'); ep.classList.remove('show'); ip.classList.add('active-panel'); ep.classList.remove('active-panel'); renderImagePanel(); }; document.getElementById('chatMenuBtn').onclick = openChatMenu; document.getElementById('callBtn').onclick = () => { if (!currentChatId) toast('请先选择联系人'); else startCall(); }; document.getElementById('toggleToolsBtn').onclick = () => { toggleToolsBar(); toggleSecondRow(); }; document.getElementById('toggleToolsRowBtn').onclick = toggleToolsRow; document.getElementById('musicTriggerBtn').onclick = toggleMusicFloat; document.getElementById('backupTriggerBtn').onclick = toggleBackupFloat; document.getElementById('shareMovieBtn').onclick = () => { const movies = appData.movieLists.flatMap(l => l.movies); if (movies.length > 0) { shareMovieWithList(); } else { showInputDialog('分享电影', '输入电影名（可选导演、年份）', (val) => { if (val) sendMessage(`🎬 ${appData.myProfile.name} 分享了一部电影《${val}》`); }); } }; document.getElementById('shareBookBtn').onclick = () => { const books = appData.bookLists.flatMap(l => l.books); if (books.length > 0) { shareBookWithList(); } else { showInputDialog('分享书单', '输入书名（可选作者）', (val) => { if (val) sendMessage(`📖 ${appData.myProfile.name} 分享了一本书《${val}》`); }); } }; document.getElementById('shareMusicBtn').onclick = () => { showInputDialog('分享音乐', '输入歌名（可选歌手）', (val) => { if (val) sendMessage(`🎶 ${appData.myProfile.name} 分享了一首歌《${val}》`); }); }; document.getElementById('voiceBtn').onclick = () => { _isVoiceMode = !_isVoiceMode; const input = document.getElementById('messageInput'); const voiceArea = document.getElementById('voiceRecordArea'); const voiceBtn = document.getElementById('voiceBtn'); if (_isVoiceMode) { if (!voiceStream) { navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } }).then(stream => { voiceStream = stream; }).catch(() => { toast('无法访问麦克风，请换用Via浏览器'); _isVoiceMode = false; input.style.display = ''; voiceArea.style.display = 'none'; voiceBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12"/></svg>'; return; }); } input.style.display = 'none'; voiceArea.style.display = 'flex'; voiceBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'; voiceBtn.title = '切换键盘'; } else { input.style.display = ''; voiceArea.style.display = 'none'; voiceBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12"/></svg>'; voiceBtn.title = '切换语音'; } }; const voiceRecordBtn = document.getElementById('voiceRecordBtn'); let voiceIsRecording = false; if (voiceRecordBtn) { voiceRecordBtn.addEventListener('click', (e) => { e.preventDefault(); if (!voiceStream) { toast('请先点击 ⌨️ 切换到语音模式'); return; } if (!voiceIsRecording) { try { voiceMediaRecorder = new MediaRecorder(voiceStream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 }); const chunks = []; voiceRecordStartTime = Date.now(); voiceCancelled = false; voiceIsRecording = true; voiceRecordBtn.classList.add('recording'); voiceRecordBtn.style.background = '#a08060'; voiceMediaRecorder.ondataavailable = ev => chunks.push(ev.data); voiceMediaRecorder.onstop = () => { clearInterval(voiceRecordTimer); voiceRecordTimer = null; voiceIsRecording = false; voiceRecordBtn.classList.remove('recording'); voiceRecordBtn.innerHTML = '点按说话'; voiceRecordBtn.style.background = ''; if (voiceCancelled) { toast('已取消录音'); return; } const blob = new Blob(chunks, { type: 'audio/webm' }); const reader = new FileReader(); reader.onload = () => { const duration = Math.round((Date.now() - voiceRecordStartTime) / 1000) || 1; const msg = { voice: reader.result, voiceDuration: duration, voiceNote: '', me: true, time: new Date().toISOString(), senderId: 'me', senderName: appData.myProfile.name }; addMessage(currentChatId, msg); appData.lastUserMsgTime[currentChatId] = Date.now(); scheduleReply(currentChatId, getContact(currentChatId)); }; reader.readAsDataURL(blob); }; voiceMediaRecorder.start(); voiceRecordBtn.innerHTML = '<span class="recording-dot"></span>录音中 00:00'; voiceRecordTimer = setInterval(() => { const elapsed = Math.floor((Date.now() - voiceRecordStartTime) / 1000); const mins = Math.floor(elapsed / 60); const secs = elapsed % 60; voiceRecordBtn.innerHTML = '<span class="recording-dot"></span>录音中 ' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0'); }, 200); } catch (err) { toast('录音启动失败，请重试'); } } else { if (voiceMediaRecorder && voiceMediaRecorder.state === 'recording') { voiceMediaRecorder.stop(); } } }); voiceRecordBtn.addEventListener('pointerdown', (e) => { if (voiceIsRecording) { voiceRecordStartPointerX = e.clientX; } }); document.addEventListener('pointermove', (e) => { if (!voiceIsRecording) return; const dx = e.clientX - voiceRecordStartPointerX; if (dx < -50) { voiceCancelled = true; voiceRecordBtn.innerHTML = '松开取消'; voiceRecordBtn.style.background = '#f44336'; } else { voiceCancelled = false; voiceRecordBtn.style.background = '#a08060'; } }); } document.getElementById('globalAddBtn').onclick = () => { const o = document.createElement('div'); o.className = 'mask show'; const card = document.createElement('div'); card.className = 'pop-card'; card.style.width = '280px'; const header = document.createElement('div'); header.className = 'pop-header'; header.textContent = '添加'; const closeBtn = document.createElement('span'); closeBtn.className = 'close-pop'; closeBtn.textContent = '✕'; closeBtn.onclick = () => o.remove(); header.appendChild(closeBtn); card.appendChild(header); const body = document.createElement('div'); body.className = 'pop-body'; const addFriendBtn = document.createElement('button'); addFriendBtn.className = 'btn-primary'; addFriendBtn.textContent = ' 添加好友'; addFriendBtn.onclick = () => { showInputDialog('好友昵称', '', (n) => { if (n) { const u = { id: 'u_' + Date.now(), name: n, avt: '', bg: '', status: STATUS_LIST[Math.floor(Math.random() * STATUS_LIST.length)], cardGroups: [{ name: '未分组', list: [] }], rule: { min: 30, max: 60, cntMin: 3, cntMax: 5 }, noReply: false, noDisturb: true, allowInitiative: true, soundEnabled: true, replyTime: 86400, muted: false }; appData.users.push(u); markDataChanged(); save(); renderChatList(); renderContactList(); currentChatId = u.id; openChat(); } }); o.remove(); }; const createGroupBtn = document.createElement('button'); createGroupBtn.className = 'btn-primary'; createGroupBtn.textContent = ' 创建群聊'; createGroupBtn.onclick = () => { const ml = [{ id: 'me', name: '我', avt: appData.myProfile.avt }, ...appData.users.map(u => ({ id: u.id, name: u.name, avt: u.avt }))]; if (ml.length === 1) { toast('请先添加好友'); return; } const sb = document.createElement('div'); sb.className = 'mask show'; const card2 = document.createElement('div'); card2.className = 'pop-card'; const header2 = document.createElement('div'); header2.className = 'pop-header'; header2.textContent = '选择成员'; const closeBtn2 = document.createElement('span'); closeBtn2.className = 'close-pop'; closeBtn2.textContent = '✕'; closeBtn2.onclick = () => sb.remove(); header2.appendChild(closeBtn2); card2.appendChild(header2); const body2 = document.createElement('div'); body2.className = 'pop-body'; ml.forEach(m => { const label = document.createElement('label'); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = m.id; cb.className = 'gcb'; label.appendChild(cb); if (m.avt) { const img = document.createElement('img'); img.src = m.avt; img.style.width = '24px'; label.appendChild(img); } label.appendChild(document.createTextNode(' ' + m.name)); body2.appendChild(label); body2.appendChild(document.createElement('br')); }); card2.appendChild(body2); const footer = document.createElement('div'); footer.className = 'pop-footer'; const selAllBtn = document.createElement('button'); selAllBtn.className = 'btn'; selAllBtn.textContent = '全选'; selAllBtn.onclick = () => sb.querySelectorAll('.gcb').forEach(c => c.checked = true); const confirmBtn = document.createElement('button'); confirmBtn.className = 'btn-primary'; confirmBtn.textContent = '创建'; confirmBtn.onclick = () => { const s = Array.from(sb.querySelectorAll('.gcb:checked')).map(c => c.value); if (!s.length) { toast('至少选一人'); return; } showInputDialog('群聊名称', '新群聊', (gn) => { if (!gn) return; const ng = { id: 'g_' + Date.now(), name: gn, members: s, avt: '', bg: '', rule: { min: 30, max: 60, cntMin: 3, cntMax: 5 }, noReply: false, noDisturb: true, announcement: '', mutedAll: false, mutedMembers: {} }; appData.groups.push(ng); markDataChanged(); save(); renderChatList(); renderContactList(); currentChatId = ng.id; openChat(); sb.remove(); o.remove(); }); }; footer.appendChild(selAllBtn); footer.appendChild(confirmBtn); card2.appendChild(footer); sb.appendChild(card2); document.body.appendChild(sb); sb.addEventListener('click', e => { if (e.target === sb) sb.remove(); }); }; body.appendChild(addFriendBtn); body.appendChild(createGroupBtn); card.appendChild(body); o.appendChild(card); document.body.appendChild(o); o.addEventListener('click', e => { if (e.target === o) o.remove(); }); applyTransparency(); }; document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => { const nav = b.dataset.nav; if (nav === 'chats' && document.getElementById('chatsPage').classList.contains('active')) return; if (nav === 'contacts' && document.getElementById('contactsPage').classList.contains('active')) return; if (nav === 'discover' && document.getElementById('discoverPage').classList.contains('active')) return; if (nav === 'me' && document.getElementById('mePage').classList.contains('active')) return; if (nav === 'chats') { switchToChatsTab(); renderChatList(); } else if (nav === 'contacts') { switchToContactsTab(); renderContactList(); } else if (nav === 'discover') switchToDiscoverTab(); else if (nav === 'me') { switchToMeTab(); renderMePage(); } }); document.getElementById('pokeBackBtn').onclick = () => { document.getElementById('pokePage').classList.remove('active'); if (_pokeFromPage === 'chat') { document.getElementById('chatPage').classList.add('active'); } else { switchToChatsTab(); renderChatList(); } }; document.getElementById('emojiManagerBackBtn').onclick = () => { document.getElementById('emojiManagerPage').classList.remove('active'); switchToMeTab(); renderMePage(); }; document.getElementById('blockedBackBtn').onclick = () => { document.getElementById('blockedPage').classList.remove('active'); switchToMeTab(); renderMePage(); }; document.getElementById('globalCardsBackBtn').onclick = () => { document.getElementById('globalCardsPage').classList.remove('active'); switchToMeTab(); renderMePage(); }; document.getElementById('userCardsBackBtn').onclick = () => { document.getElementById('userCardsPage').classList.remove('active'); if (_cardsFromPage === 'chat') { document.getElementById('chatPage').classList.add('active'); } else { switchToChatsTab(); renderChatList(); } }; document.getElementById('myBgBackBtn').onclick = () => { document.getElementById('myBgPage').classList.remove('active'); switchToMeTab(); renderMePage(); }; document.getElementById('contactBgBackBtn').onclick = () => { document.getElementById('contactBgPage').classList.remove('active'); document.getElementById('contactDetailPage').classList.add('active'); renderContactDetail(_contactBgUserId); }; document.getElementById('searchBackBtn').onclick = () => { document.getElementById('searchPage').classList.remove('active'); if (currentChatId) { document.getElementById('chatPage').classList.add('active'); } else { switchToChatsTab(); renderChatList(); } }; document.getElementById('musicBackBtn').onclick = () => { document.getElementById('musicPage').classList.remove('active'); if (_musicFromChat && currentChatId) { _musicFromChat = false; document.getElementById('chatPage').classList.add('active'); } else { switchToChatsTab(); } }; document.getElementById('contactDetailBackBtn').onclick = () => { document.getElementById('contactDetailPage').classList.remove('active'); document.getElementById('contactsPage').classList.add('active'); renderContactList(); }; document.getElementById('goMomentsBtn').onclick = () => { openMomentsPage('me', false); }; document.getElementById('goMailboxBtn').onclick = openMailboxPage; document.getElementById('goMusicBtn').onclick = () => { _musicFromChat = false; openMusicPage(); }; document.getElementById('goCompanionBtn').onclick = () => { openCompanionPage(); }; document.getElementById('goBookListsBtn').onclick = () => { openBookListPage(); }; document.getElementById('goMovieListsBtn').onclick = () => { openMovieListPage(); }; document.getElementById('goTarotBtn').onclick = () => { openTarotPage(); }; document.getElementById('goMovieTogetherBtn').onclick = () => { openMovieTogetherPage(); }; document.getElementById('goDatingBtn').onclick = () => { openDatingPage(); }; document.getElementById('datingBackBtn').onclick = () => { document.getElementById('datingPage').classList.remove('active'); switchToDiscoverTab(); }; document.getElementById('gomokuBackBtn').onclick = () => { document.getElementById('gomokuPage').classList.remove('active'); document.getElementById('datingPage').classList.add('active'); renderDatingPage(); }; document.getElementById('colorSaveBackBtn').onclick = () => {document.getElementById('colorSavePage').classList.remove('active');
  switchToMeTab();
  renderMePage();
};document.getElementById('navBgBackBtn').onclick = () => {
  document.getElementById('navBgPage').classList.remove('active');
  switchToMeTab();
  renderMePage();
};document.getElementById('goBackBtn').onclick = () => {document.getElementById('goPage').classList.remove('active');
  document.getElementById('datingPage').classList.add('active');
  renderDatingPage();
};document.getElementById('letterBackBtn').onclick = () => { if (letterRefreshInterval) clearInterval(letterRefreshInterval); autoSaveDraft(currentChatId, true); document.getElementById('letterPage').classList.remove('active'); openMailboxPage(); }; document.getElementById('momentsBackBtn').onclick = () => { document.getElementById('momentsPage').classList.remove('active'); if (_momentsFromContactDetail && currentChatId && currentChatId !== 'me') { document.getElementById('contactDetailPage').classList.add('active'); renderContactDetail(currentChatId); _momentsFromContactDetail = false; } else if (_momentsFromChat && currentChatId && currentChatId !== 'me') { document.getElementById('chatPage').classList.add('active'); } else { switchToChatsTab(); } }; document.getElementById('momentsPublishBtn').onclick = showMomentPublish; document.getElementById('chatMessages').addEventListener('dblclick', e => { const avatar = e.target.closest('.msg-avatar'); if (!avatar) return; const row = avatar.closest('.msg-row'); if (row.classList.contains('msg-self')) return; openPokePage(currentChatId, 'chat'); }); document.getElementById('mailboxBackBtn').onclick = () => { document.getElementById('mailboxPage').classList.remove('active'); document.getElementById('discoverPage').classList.add('active'); }; document.getElementById('companionBackBtn').onclick = () => { clearCompanionTimers(); document.getElementById('companionPage').classList.remove('active'); switchToDiscoverTab(); }; document.getElementById('bookListBackBtn').onclick = () => { document.getElementById('bookListPage').classList.remove('active'); switchToDiscoverTab(); }; document.getElementById('movieListBackBtn').onclick = () => { document.getElementById('movieListPage').classList.remove('active'); switchToDiscoverTab(); }; document.getElementById('dateSearchBackBtn').onclick = () => { document.getElementById('dateSearchPage').classList.remove('active'); document.getElementById('searchPage').classList.add('active'); }; document.getElementById('imageSearchBackBtn').onclick = () => { document.getElementById('imageSearchPage').classList.remove('active'); document.getElementById('searchPage').classList.add('active'); }; document.getElementById('voiceSearchBackBtn').onclick = () => { document.getElementById('voiceSearchPage').classList.remove('active'); document.getElementById('searchPage').classList.add('active'); }; document.getElementById('musicSearchBackBtn').onclick = () => { document.getElementById('musicSearchPage').classList.remove('active'); document.getElementById('searchPage').classList.add('active'); }; document.getElementById('bookSearchBackBtn').onclick = () => { document.getElementById('bookSearchPage').classList.remove('active'); document.getElementById('searchPage').classList.add('active'); }; document.getElementById('movieSearchBackBtn').onclick = () => { document.getElementById('movieSearchPage').classList.remove('active'); document.getElementById('searchPage').classList.add('active'); }; }