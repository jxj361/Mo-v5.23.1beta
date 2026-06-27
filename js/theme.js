// ========== theme.js — 主题/取色/配色/导航栏背景 ==========

// ========== 主题设置页面 ==========
function openThemePage() { document.getElementById('mePage').classList.remove('active'); document.getElementById('themePage').classList.add('active'); renderThemePage(); }
function renderThemePage() {
    const body = document.getElementById('themePageContent');
    body.innerHTML = '';

    // 当前主题色预览
    const preview = document.createElement('div');
    preview.style.cssText = `height:80px;margin:12px;border-radius:16px;background:${appData.themeColor || '#c5a47e'};display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:bold;text-shadow:0 1px 3px rgba(0,0,0,0.3);`;
    preview.textContent = '当前主题色预览';
    body.appendChild(preview);

    // ★ 新增：配色方案入口
    const schemeBtn = document.createElement('button');
    schemeBtn.className = 'btn';
    schemeBtn.style.cssText = 'width:90%;margin:8px auto;display:flex;align-items:center;justify-content:center;gap:6px;';
    schemeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('palette')}</svg>配色方案`;
    schemeBtn.onclick = () => showColorSchemePage();
    body.appendChild(schemeBtn);

    // 系统预设
    const presetTitle = document.createElement('div');
    presetTitle.style.cssText = 'padding:8px 12px;font-size:14px;font-weight:bold;color:var(--text-secondary);';
    presetTitle.textContent = '系统预设';
    body.appendChild(presetTitle);

    const presetRow = document.createElement('div');
    presetRow.style.cssText = 'display:flex;gap:12px;padding:8px 12px;flex-wrap:wrap;';
    const presets = ['#c5a47e', '#7e9cc5', '#c58ea4', '#8ec5a4', '#a48ec5', '#d4b896', '#b8c5a4', '#c5a4b8'];
    presets.forEach(color => {
        const dot = document.createElement('div');
        const isActive = (color === appData.themeColor);
        dot.style.cssText = `width:48px;height:48px;border-radius:50%;background:${color};cursor:pointer;border:3px solid ${isActive ? '#333' : 'transparent'};transition:border 0.2s;`;
        dot.onclick = () => { applyTheme(color); renderThemePage(); };
        presetRow.appendChild(dot);
    });
    body.appendChild(presetRow);

    // 自定义颜色
    const customTitle = document.createElement('div');
    customTitle.style.cssText = 'padding:8px 12px;font-size:14px;font-weight:bold;color:var(--text-secondary);margin-top:8px;';
    customTitle.textContent = '自定义颜色';
    body.appendChild(customTitle);

    const customRow = document.createElement('div');
    customRow.style.cssText = 'display:flex;align-items:center;gap:12px;padding:8px 12px;';
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = appData.themeColor || '#c5a47e';
    colorInput.style.cssText = 'width:48px;height:48px;border:none;cursor:pointer;border-radius:50%;';
    colorInput.oninput = () => {
    const hex = colorInput.value;
    if (!appData.savedColors) appData.savedColors = [];
    if (!appData.savedColors.some(c => c.hex === hex)) {
        appData.savedColors.push({ hex, note: '', time: new Date().toISOString() });
        markDataChanged(); save();
    }
    applyTheme(hex);
    renderThemePage();
};
    customRow.appendChild(colorInput);
    const colorLabel = document.createElement('span');
    colorLabel.textContent = '点击取色，实时预览';
    colorLabel.style.cssText = 'font-size:13px;color:var(--text-secondary);';
    customRow.appendChild(colorLabel);
    body.appendChild(customRow);

    // ★ 新增：高级取色入口
    const advancedBtn = document.createElement('button');
    advancedBtn.className = 'btn';
    advancedBtn.style.cssText = 'width:90%;margin:8px auto;display:flex;align-items:center;justify-content:center;gap:6px;';
    advancedBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('droplet')}</svg>高级取色`;
    advancedBtn.onclick = () => {
        showColorPicker({
    title: '选择主题色',
    currentColor: appData.themeColor || '#c5a47e',
    onConfirm: (hex) => {
        if (!appData.savedColors) appData.savedColors = [];
        if (!appData.savedColors.some(c => c.hex === hex)) {
            appData.savedColors.push({ hex, note: '', time: new Date().toISOString() });
            markDataChanged(); save();
        }
        applyTheme(hex);
        renderThemePage();
    }
});
    };
    body.appendChild(advancedBtn);

    // 恢复默认按钮
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn';
    resetBtn.style.cssText = 'width:90%;margin:8px auto;display:flex;align-items:center;justify-content:center;gap:6px;color:#f44336;';
    resetBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2">${getIconSVG('refresh-cw')}</svg>恢复默认主题和背景`;
    resetBtn.onclick = resetThemeAndBg;
    body.appendChild(resetBtn);
    document.getElementById('themeBackBtn').onclick = () => {
        document.getElementById('themePage').classList.remove('active');
        document.getElementById('mePage').classList.add('active');
        renderMePage();
    };
}
// ========== 取色弹窗（核心，可复用） ==========
function showColorPicker(options = {}) {
    const {
        title = '取色',
        currentColor = '#c5a47e',
        onConfirm = null,
        showSaveOption = false,
        saveTarget = null
    } = options;

    let selectedColor = currentColor;
    const overlay = document.createElement('div');
    overlay.className = 'mask show';

    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '320px';
    card.style.maxHeight = '90vh';

    // 标题栏
    const header = document.createElement('div');
    header.className = 'pop-header';
    header.textContent = title;
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-pop';
    closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('x')}</svg>`;
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'pop-body';
    body.style.gap = '12px';

    // 颜色预览
    const previewDiv = document.createElement('div');
    previewDiv.className = 'color-preview';
    previewDiv.style.backgroundColor = selectedColor;
    body.appendChild(previewDiv);

    // 色号显示
    const hexDisplay = document.createElement('div');
    hexDisplay.style.cssText = 'text-align:center;font-size:16px;font-weight:bold;color:var(--text-primary);';
    hexDisplay.textContent = selectedColor;
    body.appendChild(hexDisplay);

    // 三个取色方式 tab
    const tabRow = document.createElement('div');
    tabRow.style.cssText = 'display:flex;gap:4px;';
    const tabs = [
        { label: '预设', value: 'preset' },
        { label: '色号', value: 'hex' },
        { label: '图片', value: 'image' }
    ];
    let activeTab = 'preset';
    const tabContentArea = document.createElement('div');
    tabContentArea.style.cssText = 'min-height:120px;';

    tabs.forEach(tab => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'btn';
        tabBtn.style.cssText = `flex:1;font-size:12px;padding:6px;${tab.value === activeTab ? 'background:var(--theme);color:white;' : ''}`;
        tabBtn.textContent = tab.label;
        tabBtn.onclick = () => {
            activeTab = tab.value;
            tabRow.querySelectorAll('button').forEach(b => { b.style.background = ''; b.style.color = ''; });
            tabBtn.style.background = 'var(--theme)';
            tabBtn.style.color = 'white';
            renderTabContent(tab.value);
        };
        tabRow.appendChild(tabBtn);
    });
    body.appendChild(tabRow);
    body.appendChild(tabContentArea);

    function updateColor(hex) {
        selectedColor = hex;
        previewDiv.style.backgroundColor = hex;
        hexDisplay.textContent = hex;
    }

    function renderTabContent(tabValue) {
        tabContentArea.innerHTML = '';

        if (tabValue === 'preset') {
            const presetGrid = document.createElement('div');
            presetGrid.className = 'color-picker-preset';
            const presetColors = [
                '#c5a47e', '#7e9cc5', '#c58ea4', '#8ec5a4', '#a48ec5',
                '#d4b896', '#b8c5a4', '#c5a4b8', '#e8c9a0', '#9ec5b8',
                '#f0e6d8', '#d8c5e6', '#a0c5e8', '#e8c5d8', '#c5d8e6',
                '#333333', '#666666', '#999999', '#ffffff', '#f5f3f0'
            ];
            presetColors.forEach(color => {
                const dot = document.createElement('div');
                dot.className = 'color-preset-dot';
                dot.style.backgroundColor = color;
                if (color === selectedColor) dot.classList.add('active');
                dot.onclick = () => {
                    updateColor(color);
                    presetGrid.querySelectorAll('.color-preset-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                };
                presetGrid.appendChild(dot);
            });
            tabContentArea.appendChild(presetGrid);

        } else if (tabValue === 'hex') {
            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display:flex;gap:8px;align-items:center;justify-content:center;';
            const hexInput = document.createElement('input');
            hexInput.className = 'color-hex-input';
            hexInput.value = selectedColor;
            hexInput.placeholder = '#c5a47e';
            hexInput.oninput = () => {
                const val = hexInput.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(val)) updateColor(val);
            };
            const applyBtn = document.createElement('button');
            applyBtn.className = 'btn-primary';
            applyBtn.textContent = '应用';
            applyBtn.onclick = () => {
                const val = hexInput.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(val)) updateColor(val);
                else toast('请输入正确的色号（如 #c5a47e）');
            };
            inputRow.appendChild(hexInput);
            inputRow.appendChild(applyBtn);
            tabContentArea.appendChild(inputRow);

            const nativeRow = document.createElement('div');
            nativeRow.style.cssText = 'display:flex;align-items:center;gap:8px;justify-content:center;margin-top:8px;';
            const nativePicker = document.createElement('input');
            nativePicker.type = 'color';
            nativePicker.value = selectedColor;
            nativePicker.style.cssText = 'width:40px;height:40px;border:none;cursor:pointer;border-radius:50%;';
            nativePicker.oninput = () => updateColor(nativePicker.value);
            nativeRow.appendChild(nativePicker);
            nativeRow.appendChild(document.createTextNode('系统取色器'));
            tabContentArea.appendChild(nativeRow);

        } else if (tabValue === 'image') {
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'btn';
            uploadBtn.style.cssText = 'width:100%;';
            uploadBtn.textContent = '上传图片取色';
            uploadBtn.onclick = () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = function(e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        const img = new Image();
                        img.onload = function() {
                            const canvas = document.createElement('canvas');
                            const maxW = 300;
                            const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
                            canvas.width = Math.round(img.width * ratio);
                            canvas.height = Math.round(img.height * ratio);
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            canvas.className = 'color-image-canvas';
                            canvas.style.cursor = 'crosshair';
                            canvas.onclick = function(e2) {
                                const rect2 = canvas.getBoundingClientRect();
                                const scaleX2 = canvas.width / rect2.width;
                                const scaleY2 = canvas.height / rect2.height;
                                const px = Math.floor((e2.clientX - rect2.left) * scaleX2);
                                const py = Math.floor((e2.clientY - rect2.top) * scaleY2);
                                const pixel = ctx.getImageData(px, py, 1, 1).data;
                                const hex = '#' + [pixel[0], pixel[1], pixel[2]]
                                    .map(v => v.toString(16).padStart(2, '0'))
                                    .join('');
                                updateColor(hex);
                            };
                            tabContentArea.innerHTML = '';
                            tabContentArea.appendChild(canvas);
                            const hint = document.createElement('div');
                            hint.textContent = '点击图片上任意位置取色';
                            hint.style.cssText = 'text-align:center;font-size:11px;color:var(--text-secondary);margin-top:4px;';
                            tabContentArea.appendChild(hint);
                        };
                        img.src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                };
                fileInput.click();
            };
            tabContentArea.appendChild(uploadBtn);
        }
    }
    renderTabContent('preset');
    body.appendChild(tabContentArea);
    card.appendChild(body);

    // 底部按钮
    const footer = document.createElement('div');
    footer.className = 'pop-footer';

    if (showSaveOption && saveTarget === 'savedColors') {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn';
        saveBtn.textContent = '保存颜色';
        saveBtn.onclick = () => {
            if (!appData.savedColors) appData.savedColors = [];
            if (!appData.savedColors.some(c => c.hex === selectedColor)) {
                appData.savedColors.push({ hex: selectedColor, note: '', time: new Date().toISOString() });
                markDataChanged(); save();
                toast('颜色已保存');
            } else {
                toast('此颜色已保存');
            }
        };
        footer.appendChild(saveBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-primary';
    confirmBtn.textContent = '确认';
    confirmBtn.onclick = () => { overlay.remove(); if (onConfirm) onConfirm(selectedColor); };
    footer.appendChild(confirmBtn);

    card.appendChild(footer);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
// ========== 配色方案 ==========
function showColorSchemePage() {
    const overlay = document.createElement('div');
    overlay.className = 'mask show';
    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '320px';
    card.style.maxHeight = '85vh';

    const header = document.createElement('div');
    header.className = 'pop-header';
    header.textContent = '配色方案';
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-pop';
    closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('x')}</svg>`;
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'pop-body';
    body.style.gap = '12px';

    const presetSchemes = [
        { name: '暖金', main: '#c5a47e', secondary: '#f0e6d8', accent: '#9b7a5c' },
        { name: '天空蓝', main: '#7e9cc5', secondary: '#e6eef5', accent: '#5c7ea8' },
        { name: '玫瑰', main: '#c58ea4', secondary: '#f5e6ec', accent: '#a85c74' },
        { name: '森林', main: '#8ec5a4', secondary: '#e6f5ec', accent: '#5ca874' },
        { name: '薰衣草', main: '#a48ec5', secondary: '#ece6f5', accent: '#745ca8' },
        { name: '焦糖', main: '#d4b896', secondary: '#f5ede0', accent: '#a87c5c' }
    ];

    const currentScheme = appData.currentScheme || '';

    presetSchemes.forEach(scheme => {
        const schemeCard = document.createElement('div');
        schemeCard.className = 'color-scheme-card' + (currentScheme === scheme.name ? ' active' : '');
        schemeCard.innerHTML = `
            <div class="color-scheme-swatch" style="background:${scheme.main};" title="主色"></div>
            <div class="color-scheme-swatch" style="background:${scheme.secondary};" title="辅色"></div>
            <div class="color-scheme-swatch" style="background:${scheme.accent};" title="点缀色"></div>
        `;
        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'flex:1;font-size:13px;margin-left:8px;';
        nameSpan.textContent = scheme.name;
        schemeCard.appendChild(nameSpan);
        schemeCard.onclick = () => {
            applyColorScheme(scheme);
            overlay.remove();
            renderThemePage();
        };
        body.appendChild(schemeCard);
    });
    // 显示用户自定义的色卡
    const customSchemes = appData.customColorSchemes || [];
    customSchemes.forEach(scheme => {
      const schemeCard = document.createElement('div');
      schemeCard.className = 'color-scheme-card' + (currentScheme === scheme.name ? ' active' : '');
      schemeCard.innerHTML = `
            <div class="color-scheme-swatch" style="background:${scheme.main};" title="主色"></div>
            <div class="color-scheme-swatch" style="background:${scheme.secondary};" title="辅色"></div>
            <div class="color-scheme-swatch" style="background:${scheme.accent};" title="点缀色"></div>
        `;
      const nameSpan = document.createElement('span');
      nameSpan.style.cssText = 'flex:1;font-size:13px;margin-left:8px;';
      nameSpan.textContent = scheme.name + '(自定义)';
      schemeCard.appendChild(nameSpan);
      schemeCard.onclick = () => {
        applyColorScheme(scheme);
        overlay.remove();
        renderThemePage();
      };
      // 长按删除自定义色卡
      let longPressTimer;
      schemeCard.addEventListener('touchstart', () => {
          longPressTimer = setTimeout(() => {
              showConfirm(`删除自定义色卡"${scheme.name}"？`, () => {
                  const idx = appData.customColorSchemes.findIndex(s => s.name === scheme.name);
                  if (idx >= 0) {
                      appData.customColorSchemes.splice(idx, 1);
                      markDataChanged(); save();
                      overlay.remove();
                      showColorSchemePage();
                      toast('色卡已删除');
                  }
              });
          }, 600);
      });
      schemeCard.addEventListener('touchend', () => clearTimeout(longPressTimer));
      schemeCard.addEventListener('touchmove', () => clearTimeout(longPressTimer));
      body.appendChild(schemeCard);
    });

    const customBtn = document.createElement('button');
    customBtn.className = 'btn';
    customBtn.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;margin-top:8px;';
    customBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('plus')}</svg>自定义色卡`;
    customBtn.onclick = () => { overlay.remove(); showCustomSchemeCreator(); };
    body.appendChild(customBtn);

    card.appendChild(body);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function applyColorScheme(scheme) {
    if (!scheme) return;
    appData.currentScheme = scheme.name;
    const root = document.documentElement;
    const mainR = parseInt(scheme.main.slice(1, 3), 16);
    const mainG = parseInt(scheme.main.slice(3, 5), 16);
    const mainB = parseInt(scheme.main.slice(5, 7), 16);
    root.style.setProperty('--theme', scheme.main);
    root.style.setProperty('--theme-dark', `rgb(${Math.max(0, mainR - 40)}, ${Math.max(0, mainG - 40)}, ${Math.max(0, mainB - 40)})`);
    root.style.setProperty('--theme-light', `rgba(${mainR}, ${mainG}, ${mainB}, 0.15)`);
    root.style.setProperty('--bubble-sent', scheme.main);
    root.style.setProperty('--bubble-sent-text', '#fff');
    root.style.setProperty('--bubble-recv', scheme.secondary);
    root.style.setProperty('--bubble-recv-border', scheme.accent);
    root.style.setProperty('--border-light', scheme.secondary);
    appData.themeColor = scheme.main;
    markDataChanged(); save();
    try { localStorage.setItem('Mo_theme_backup', scheme.main); } catch (e) {}
    toast('配色方案已应用');

    ['chats', 'contacts', 'discover', 'me'].forEach(pageId => {
        if (!appData.navBgs) appData.navBgs = {};
        if (!appData.navBgs[pageId]) appData.navBgs[pageId] = {};
        appData.navBgs[pageId].mode = 'color';
        appData.navBgs[pageId].color = scheme.secondary;
        applyNavBg(pageId);
    });

    const containerMap = {
        chats: '#chatListContainer',
        contacts: '#contactListContainer',
        discover: '#discoverListContainer',
        me: '#mePageContent'
    };
    ['chats', 'contacts', 'discover', 'me'].forEach(pageId => {
        const el = document.querySelector(containerMap[pageId]);
        if (el) el.style.background = scheme.secondary;
    });

    document.documentElement.style.setProperty('--text-shadow', 'none');
    renderChatList();
}

function showCustomSchemeCreator() {
    const overlay = document.createElement('div');
    overlay.className = 'mask show';
    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '300px';

    const header = document.createElement('div');
    header.className = 'pop-header';
    header.textContent = '自定义色卡';
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-pop';
    closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('x')}</svg>`;
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'pop-body';
    body.style.gap = '12px';

    const colors = { main: '#c5a47e', secondary: '#f0e6d8', accent: '#9b7a5c' };

    function addColorRow(label, key) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const labelSpan = document.createElement('span');
        labelSpan.style.cssText = 'font-size:13px;width:50px;';
        labelSpan.textContent = label;
        const previewDot = document.createElement('div');
        previewDot.style.cssText = `width:32px;height:32px;border-radius:50%;background:${colors[key]};border:1px solid var(--border-light);`;
        const pickBtn = document.createElement('button');
        pickBtn.className = 'btn';
        pickBtn.style.cssText = 'font-size:12px;padding:4px 8px;';
        pickBtn.textContent = '取色';
        pickBtn.onclick = () => {
            showColorPicker({
                title: '选择' + label,
                currentColor: colors[key],
                onConfirm: (hex) => { colors[key] = hex; previewDot.style.background = hex; }
            });
        };
        row.appendChild(labelSpan);
        row.appendChild(previewDot);
        row.appendChild(pickBtn);
        return row;
    }

    body.appendChild(addColorRow('主色', 'main'));
    body.appendChild(addColorRow('辅色', 'secondary'));
    body.appendChild(addColorRow('点缀色', 'accent'));

    const nameRow = document.createElement('div');
    nameRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const nameLabel = document.createElement('span');
    nameLabel.style.cssText = 'font-size:13px;width:50px;';
    nameLabel.textContent = '名称';
    const nameInput = document.createElement('input');
    nameInput.placeholder = '输入色卡名称';
    nameInput.style.cssText = 'flex:1;padding:4px 8px;border-radius:8px;border:1px solid var(--border-light);font-size:13px;';
    nameInput.value = '自定义色卡';
    nameRow.appendChild(nameLabel);
    nameRow.appendChild(nameInput);
    body.appendChild(nameRow);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = '保存并应用';
    saveBtn.onclick = () => {
        let schemeName = nameInput.value.trim() || '自定义色卡';
        // 如果是默认名称且已存在，自动加编号避免覆盖
        if (schemeName === '自定义色卡' && appData.customColorSchemes && appData.customColorSchemes.some(s => s.name === '自定义色卡')) {
          let num = 1;
          while (appData.customColorSchemes.some(s => s.name === '自定义色卡 ' + num)) { num++; }
          schemeName = '自定义色卡 ' + num;
        }const scheme = {
            name: schemeName,
            main: colors.main,
            secondary: colors.secondary,
            accent: colors.accent
        };
        // 把自定义色卡保存到 appData.customColorSchemes 里，下次打开还能用
        if (!appData.customColorSchemes) appData.customColorSchemes = [];
        // 重名覆盖
        const existIdx = appData.customColorSchemes.findIndex(s => s.name === scheme.name);
        if (existIdx >= 0) {
            appData.customColorSchemes[existIdx] = scheme;
        } else {
            // 检查是否超过10组限制
            if (appData.customColorSchemes.length >= 10) {
                toast('最多保存10组色卡，请先删除旧色卡');
                return;
            }
            appData.customColorSchemes.push(scheme);
        }
        markDataChanged(); save();
        applyColorScheme(scheme);
        overlay.remove();
        renderThemePage();
    };
    body.appendChild(saveBtn);

    card.appendChild(body);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
// ========== 取色保存页面 ==========
function openColorSavePage() {
    hideAllPages();
    document.getElementById('colorSavePage').classList.add('active');
    renderColorSavePage();
}

function renderColorSavePage() {
    const body = document.getElementById('colorSavePageContent');
    while (body.firstChild) body.removeChild(body.firstChild);

    if (!appData.savedColors) appData.savedColors = [];
    if (!window._selectedColorIndex) window._selectedColorIndex = -1;
    const savedColors = appData.savedColors;

    // 添加颜色/取色按钮
    const addBtn = document.createElement('button');
    addBtn.className = 'btn';
    addBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;width:100%;margin-bottom:10px;';
    addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加颜色/取色`;
    addBtn.onclick = () => {
        showColorPicker({
            title: '取色保存',
            currentColor: '#c5a47e',
            onConfirm: (hex) => {
                if (!appData.savedColors.some(c => c.hex === hex)) {
                    appData.savedColors.push({ hex, note: '', time: new Date().toISOString() });
                    markDataChanged(); save();
                }
                renderColorSavePage();
            }
        });
    };
    body.appendChild(addBtn);

    // 颜色网格
    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start;padding:0 4px;';

    if (savedColors.length === 0) {
        const empty = document.createElement('div');
        empty.textContent = '暂无颜色';
        empty.style.cssText = 'width:100%;text-align:center;color:var(--text-secondary);padding:40px;';
        body.appendChild(empty);
    } else {
        savedColors.forEach((colorItem, idx) => {
            const dot = document.createElement('div');
            dot.style.cssText = `width:44px;height:44px;border-radius:8px;background:${colorItem.hex};cursor:pointer;border:2px solid ${window._selectedColorIndex === idx ? 'var(--theme)' : 'transparent'};transition:border 0.2s;`;
            
            // 点击选中
            dot.onclick = () => {
                window._selectedColorIndex = (window._selectedColorIndex === idx) ? -1 : idx;
                grid.querySelectorAll('div').forEach((d, i) => {
                    if (i < savedColors.length) {
                        d.style.border = (i === window._selectedColorIndex) ? '2px solid var(--theme)' : '2px solid transparent';
                    }
                });
            };

            // 长按删除
            let longPressTimer;
            dot.addEventListener('touchstart', () => {
                longPressTimer = setTimeout(() => {
                    showConfirm('删除这个颜色？', () => {
                        appData.savedColors.splice(idx, 1);
                        window._selectedColorIndex = -1;
                        markDataChanged(); save();
                        renderColorSavePage();
                    });
                }, 600);
            });
            dot.addEventListener('touchend', () => clearTimeout(longPressTimer));
            dot.addEventListener('touchmove', () => clearTimeout(longPressTimer));

            grid.appendChild(dot);
        });
        body.appendChild(grid);
    }

    // 底部共用按钮
    const selectedIndex = window._selectedColorIndex;
    const hasSelection = selectedIndex >= 0 && selectedIndex < savedColors.length;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;';

    const themeBtn = document.createElement('button');
    themeBtn.className = 'btn';
    themeBtn.style.cssText = `flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;${!hasSelection ? 'opacity:0.5;' : ''}`;
    themeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('check')}</svg>应用到主题色`;
    themeBtn.onclick = () => {
      const idx = window._selectedColorIndex;
      const colors = appData.savedColors || [];
      if (idx < 0 || idx >= colors.length) { toast('请先选择一个颜色'); return; }
      applyTheme(colors[idx].hex);
      toast('主题色已更新');
    };
    btnRow.appendChild(themeBtn);

    const navBgBtn = document.createElement('button');
    navBgBtn.className = 'btn';
    navBgBtn.style.cssText = `flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;${!hasSelection ? 'opacity:0.5;' : ''}`;
    navBgBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('image')}</svg>设为导航栏背景`;
    navBgBtn.onclick = () => {
      const idx = window._selectedColorIndex;
      const colors = appData.savedColors || [];
      if (idx < 0 || idx >= colors.length) { toast('请先选择一个颜色'); return; }
      showNavBgPageSelect(colors[idx].hex);
    };
    btnRow.appendChild(navBgBtn);

    body.appendChild(btnRow);
    // 应用到全部页面按钮
const applyAllBtn = document.createElement('button');
applyAllBtn.className = 'btn';
applyAllBtn.style.cssText = 'width:100%;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;';
applyAllBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${getIconSVG('copy')}</svg>应用到全部页面`;
applyAllBtn.onclick = () => {
    const idx = window._selectedColorIndex;
    const colors = appData.savedColors || [];
    if (idx < 0 || idx >= colors.length) { toast('请先选择一个颜色'); return; }
    const selectedColor = colors[idx].hex;
    ['chats', 'contacts', 'discover', 'me'].forEach(pageId => {
        if (!appData.navBgs) appData.navBgs = {};
        if (!appData.navBgs[pageId]) appData.navBgs[pageId] = {};
        appData.navBgs[pageId].mode = 'color';
        appData.navBgs[pageId].color = selectedColor;
        applyNavBg(pageId);
    });
    markDataChanged(); save();
    toast('已应用到全部页面');
};
body.appendChild(applyAllBtn);
}

// 导航栏背景页面选择（共用）
function showNavBgPageSelect(hex) {
    const overlay = document.createElement('div');
    overlay.className = 'mask show';
    const card = document.createElement('div');
    card.className = 'pop-card';
    card.style.width = '250px';

    const header = document.createElement('div');
    header.className = 'pop-header';
    header.textContent = '应用到哪个页面？';
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-pop';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'pop-body';

    const pages = [
        { id: 'chats', name: '传讯' },
        { id: 'contacts', name: '通讯录' },
        { id: 'discover', name: '发现' },
        { id: 'me', name: '我' }
    ];

    pages.forEach(page => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.cssText = 'width:100%;text-align:left;margin-bottom:4px;';
        btn.textContent = page.name;
        btn.onclick = () => {
            if (!appData.navBgs) appData.navBgs = {};
            if (!appData.navBgs[page.id]) appData.navBgs[page.id] = {};
            appData.navBgs[page.id].mode = 'color';
            appData.navBgs[page.id].color = hex;
            markDataChanged(); save();
            applyNavBg(page.id);
            overlay.remove();
            toast('已设为 ' + page.name + ' 导航栏背景');
        };
        body.appendChild(btn);
    });

    card.appendChild(body);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}
// ========== 导航栏背景设置 ==========
function openNavBgPage() {
  hideAllPages();
  document.getElementById('navBgPage').classList.add('active');
  renderNavBgPage();
}

function renderNavBgPage() {
      const body = document.getElementById('navBgPageContent');
      while (body.firstChild) body.removeChild(body.firstChild);

    if (!appData.navBgs) appData.navBgs = {};

    const pages = [
        { id: 'chats', name: '传讯' },
        { id: 'contacts', name: '通讯录' },
        { id: 'discover', name: '发现' },
        { id: 'me', name: '我' }
    ];

    // 四个页面 tab 切换
    const tabRow = document.createElement('div');
    tabRow.style.cssText = 'display:flex;gap:4px;';
    let activePage = 'chats';
    const tabContent = document.createElement('div');

    pages.forEach(page => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'btn';
        tabBtn.style.cssText = `flex:1;font-size:11px;padding:6px;${page.id === activePage ? 'background:var(--theme);color:white;' : ''}`;
        tabBtn.textContent = page.name;
        tabBtn.onclick = () => {
            activePage = page.id;
            tabRow.querySelectorAll('button').forEach(b => { b.style.background = ''; b.style.color = ''; });
            tabBtn.style.background = 'var(--theme)';
            tabBtn.style.color = 'white';
            renderPageSettings(page.id);
        };
        tabRow.appendChild(tabBtn);
    });

    body.appendChild(tabRow);
    body.appendChild(tabContent);

    function renderPageSettings(pageId) {
        tabContent.innerHTML = '';
        const settings = appData.navBgs[pageId] || { mode: 'followTheme', color: '#f5f3f0', image: '', overlayOpacity: 40 };

        // 模式选择
        const modeTitle = document.createElement('div');
        modeTitle.style.cssText = 'font-size:13px;font-weight:bold;color:var(--text-primary);';
        modeTitle.textContent = '背景模式';
        tabContent.appendChild(modeTitle);

        const modeRow = document.createElement('div');
        modeRow.style.cssText = 'display:flex;gap:6px;';

        const followBtn = document.createElement('button');
        followBtn.className = 'btn';
        followBtn.style.cssText = `flex:1;font-size:12px;padding:8px;${settings.mode === 'followTheme' ? 'background:var(--theme);color:white;' : ''}`;
        followBtn.textContent = '跟随主题色';
        followBtn.onclick = () => {
            settings.mode = 'followTheme';
            appData.navBgs[pageId] = settings;
            markDataChanged(); save();
            renderPageSettings(pageId);
            applyNavBg(pageId);
        };

        const colorBtn = document.createElement('button');
        colorBtn.className = 'btn';
        colorBtn.style.cssText = `flex:1;font-size:12px;padding:8px;${settings.mode === 'color' ? 'background:var(--theme);color:white;' : ''}`;
        colorBtn.textContent = '自定义颜色';
        colorBtn.onclick = () => {
            settings.mode = 'color';
            appData.navBgs[pageId] = settings;
            markDataChanged(); save();
            renderPageSettings(pageId);
            applyNavBg(pageId);
        };

        const imageBtn = document.createElement('button');
        imageBtn.className = 'btn';
        imageBtn.style.cssText = `flex:1;font-size:12px;padding:8px;${settings.mode === 'image' ? 'background:var(--theme);color:white;' : ''}`;
        imageBtn.textContent = '自定义图片';
        imageBtn.onclick = () => {
            settings.mode = 'image';
            appData.navBgs[pageId] = settings;
            markDataChanged(); save();
            renderPageSettings(pageId);
            applyNavBg(pageId);
        };

        modeRow.appendChild(followBtn);
        modeRow.appendChild(colorBtn);
        modeRow.appendChild(imageBtn);
        tabContent.appendChild(modeRow);

        // 颜色模式：取色按钮
        if (settings.mode === 'color') {
            const colorRow = document.createElement('div');
            colorRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px;';
            const colorPreview = document.createElement('div');
            colorPreview.style.cssText = `width:36px;height:36px;border-radius:50%;background:${settings.color || '#f5f3f0'};border:1px solid var(--border-light);`;
            const pickBtn = document.createElement('button');
            pickBtn.className = 'btn';
            pickBtn.style.cssText = 'font-size:12px;padding:6px 10px;';
            pickBtn.textContent = '取色';
            pickBtn.onclick = () => {
                showColorPicker({
                    title: '导航栏背景色',
                    currentColor: settings.color || '#f5f3f0',
                    onConfirm: (hex) => {
    if (!appData.savedColors) appData.savedColors = [];
    if (!appData.savedColors.some(c => c.hex === hex)) {
        appData.savedColors.push({ hex, note: '', time: new Date().toISOString() });
    }
    settings.color = hex;
    appData.navBgs[pageId] = settings;
    markDataChanged(); save();
    renderPageSettings(pageId);
    applyNavBg(pageId);
}
                });
            };
            colorRow.appendChild(colorPreview);
            colorRow.appendChild(pickBtn);
            tabContent.appendChild(colorRow);
        }

        // 图片模式：上传和预览
        if (settings.mode === 'image') {
            const imageRow = document.createElement('div');
            imageRow.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:8px;';

            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'btn';
            uploadBtn.style.cssText = 'width:100%;';
            uploadBtn.textContent = '上传背景图';
            uploadBtn.onclick = () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = async function(e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                        const b64 = await processImage(file, 1200, 0.85);
                        settings.image = b64;
                        appData.navBgs[pageId] = settings;
                        markDataChanged(); save();
                        renderPageSettings(pageId);
                        applyNavBg(pageId);
                        toast('背景图已设置');
                    } catch { toast('图片处理失败'); }
                };
                fileInput.click();
            };
            imageRow.appendChild(uploadBtn);

            if (settings.image) {
                const previewImg = document.createElement('img');
                previewImg.src = settings.image;
                previewImg.style.cssText = 'width:100%;max-height:100px;object-fit:cover;border-radius:8px;';
                imageRow.appendChild(previewImg);

                const clearBtn = document.createElement('button');
                clearBtn.className = 'btn';
                clearBtn.style.cssText = 'color:#f44336;';
                clearBtn.textContent = '清除图片';
                clearBtn.onclick = () => {
                    settings.image = '';
                    appData.navBgs[pageId] = settings;
                    markDataChanged(); save();
                    renderPageSettings(pageId);
                    applyNavBg(pageId);
                };
                imageRow.appendChild(clearBtn);
            }
            tabContent.appendChild(imageRow);

            // 遮罩透明度滑块
            const opacityRow = document.createElement('div');
            opacityRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px;';
            const opacityLabel = document.createElement('span');
            opacityLabel.style.cssText = 'font-size:12px;color:var(--text-secondary);';
            opacityLabel.textContent = '遮罩透明度';
            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = '0';
            opacitySlider.max = '100';
            opacitySlider.value = settings.overlayOpacity || 40;
            opacitySlider.style.cssText = 'flex:1;height:6px;-webkit-appearance:none;appearance:none;background:var(--theme-light);border-radius:3px;outline:none;';
            const opacityValue = document.createElement('span');
            opacityValue.style.cssText = 'font-size:11px;min-width:35px;text-align:center;';
            opacityValue.textContent = (settings.overlayOpacity || 40) + '%';
            opacitySlider.oninput = () => {
                opacityValue.textContent = opacitySlider.value + '%';
                settings.overlayOpacity = parseInt(opacitySlider.value);
                appData.navBgs[pageId] = settings;
                applyNavBg(pageId);
            };
            opacitySlider.onchange = () => { markDataChanged(); save(); };
            opacityRow.appendChild(opacityLabel);
            opacityRow.appendChild(opacitySlider);
            opacityRow.appendChild(opacityValue);
            tabContent.appendChild(opacityRow);
        }
    }

    renderPageSettings('chats');
    body.appendChild(tabContent);

    // 应用到全部页面按钮
    const applyAllBtn = document.createElement('button');
    applyAllBtn.className = 'btn';
    applyAllBtn.style.cssText = 'width:100%;margin-top:8px;';
    applyAllBtn.textContent = '应用到全部页面';
    applyAllBtn.onclick = () => {
        const currentSettings = appData.navBgs[activePage] || { mode: 'followTheme', color: '#f5f3f0', image: '', overlayOpacity: 40 };
        pages.forEach(page => {
            appData.navBgs[page.id] = JSON.parse(JSON.stringify(currentSettings));
            applyNavBg(page.id);
        });
        markDataChanged(); save();
        toast('已应用到全部页面');
    };
    body.appendChild(applyAllBtn);

}

// 应用导航栏背景
function applyNavBg(pageId) {
  const settings = appData.navBgs && appData.navBgs[pageId];
  const pageEl = document.getElementById(pageId + 'Page');
  if (!pageEl) return;

  const oldOverlay = pageEl.querySelector('.page-bg-overlay');
  if (oldOverlay) oldOverlay.remove();

  // 记录图片模式，供 renderChatList / renderContactList 使用
  if (!window._navBgImageMode) window._navBgImageMode = {};
  window._navBgImageMode[pageId] = !!(settings && settings.mode === 'image' && settings.image);

  // 内容区背景处理
  const contentSelectors = {
    chats: ['#chatListContainer'],
    contacts: ['#contactListContainer'],
    discover: ['#discoverListContainer'],
    me: ['#mePageContent']
  };

  if (!settings || settings.mode === 'followTheme') {
    const themeColor = appData.themeColor || '#c5a47e';
    pageEl.style.backgroundImage = '';
    pageEl.style.backgroundColor = themeColor;
    const selectors = contentSelectors[pageId] || [];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.background = themeColor;
    });
    
    // 去掉文字阴影
    document.documentElement.style.setProperty('--text-shadow', 'none');
    // 发现页恢复文字阴影
    if (pageId === 'discover') {
      document.querySelectorAll('#discoverListContainer .name').forEach(el => {
        el.style.textShadow = '';
        el.style.background = '';
      });
      document.querySelectorAll('#discoverListContainer .chat-item').forEach(el => {
        el.style.borderBottomColor = '';
      });
    }
  } else if (settings.mode === 'color') {
    pageEl.style.backgroundImage = '';
    pageEl.style.backgroundColor = (settings.color && settings.color.trim()) ? settings.color : '';
    const selectors = contentSelectors[pageId] || [];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.background = settings.color || '#f5f3f0';
    });
   
    // 去掉文字阴影
    document.documentElement.style.setProperty('--text-shadow', 'none');
    // 发现页恢复文字阴影
    if (pageId === 'discover') {
      document.querySelectorAll('#discoverListContainer .name').forEach(el => {
        el.style.textShadow = '';
        el.style.background = '';
      });
    }
  } else if (settings.mode === 'image' && settings.image) {
    pageEl.style.backgroundImage = `url(${settings.image})`;
    pageEl.style.backgroundSize = 'cover';
    pageEl.style.backgroundPosition = 'center';
    pageEl.style.backgroundColor = '';
    const selectors = contentSelectors[pageId] || [];
    selectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) el.style.background = 'transparent';
    });
    // 发现页图片背景下去掉文字阴影和分割线
    if (pageId === 'discover') {
      document.querySelectorAll('#discoverListContainer .name').forEach(el => {
        el.style.textShadow = 'none';
        el.style.background = 'transparent';
      });
      document.querySelectorAll('#discoverListContainer .chat-item').forEach(el => {
        el.style.borderBottomColor = 'transparent';
      });
    }

    const opacity = (settings.overlayOpacity || 40) / 100;
    if (opacity >= 0.99) {
      pageEl.style.backgroundColor = '#ffffff';
    } else {
      const bgOverlay = document.createElement('div');
      bgOverlay.className = 'page-bg-overlay';
      bgOverlay.style.background = `rgba(255, 255, 255, ${opacity})`;
      pageEl.appendChild(bgOverlay);
    }
  }

  // 重新渲染对应列表，让分割线和条目样式根据 _navBgImageMode 生效
  if (pageId === 'chats') renderChatList();
  if (pageId === 'contacts') renderContactList();
}
// 初始化导航栏背景
function initNavBgs() {
  if (!appData.navBgs) appData.navBgs = {};
  if (!appData.savedColors) appData.savedColors = [];
  if (!window._navBgImageMode) window._navBgImageMode = {};
    ['chats', 'contacts', 'discover', 'me'].forEach(pageId => {
    if (appData.navBgs[pageId]) {
      applyNavBg(pageId);
    }
  });
}
// 在"我"页面添加入口按钮
window.addThemeSectionButtons = function(container) {
    // 页面背景入口
    const navBgBtn = document.createElement('button');
    navBgBtn.className = 'btn';
    navBgBtn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
    navBgBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('image')}</svg>页面背景`;
    navBgBtn.onclick = () => openNavBgPage();
    container.appendChild(navBgBtn);

    // 取色保存入口
    const colorSaveBtn = document.createElement('button');
    colorSaveBtn.className = 'btn';
    colorSaveBtn.style.cssText = 'width:90%;margin:2px auto;display:flex;align-items:center;text-align:left';
    colorSaveBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;flex-shrink:0;">${getIconSVG('droplet')}</svg>取色保存`;
    colorSaveBtn.onclick = () => openColorSavePage();
    container.appendChild(colorSaveBtn);
};
// 一键恢复默认主题和背景
function resetThemeAndBg() {
  showConfirm('恢复默认主题色和所有页面背景？\n聊天记录等数据不受影响', () => {
    // 1. 恢复默认主题色
    applyTheme('#c5a47e');

    // 2. 清除配色方案
    appData.currentScheme = '';

    // 3. 清空导航栏背景数据
    ['chats', 'contacts', 'discover', 'me'].forEach(pageId => {
      appData.navBgs[pageId] = { mode: 'followTheme', color: '', image: '', overlayOpacity: 40 };
    });

    // 4. 恢复 CSS 变量
    const root = document.documentElement;
    root.style.setProperty('--border-light', '#e9eef3');
    root.style.setProperty('--text-shadow', '0 0 4px rgba(255, 255, 255, 0.95)');
    root.style.setProperty('--bubble-recv', '#ffffff');
    root.style.setProperty('--bubble-recv-border', 'var(--theme)');

    // 5. 清除所有页面和内容区的背景
    ['chatsPage', 'contactsPage', 'discoverPage', 'mePage'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.backgroundImage = '';
        el.style.background = '';
        el.style.backgroundColor = '#ffffff';
      }
    });
    ['chatListContainer', 'contactListContainer', 'discoverListContainer', 'mePageContent'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.background = '#ffffff';
        el.style.backgroundColor = '#ffffff';
      }
    });
    document.querySelectorAll('.page-bg-overlay').forEach(el => el.remove());

    // 6. 清除全局标记
    window._navBgImageMode = {};
    window._currentSchemeSecondaryColor = '';

    // 7. 保存并刷新列表
    markDataChanged();
    save();
    try { localStorage.setItem('Mo_theme_backup', '#c5a47e'); } catch (e) {}
    renderChatList();
    renderContactList();
    toast('已恢复默认主题和背景');
  });
}