export default class Configurator {
  PALETTE_FOLDER = 'https://raw.githubusercontent.com/deejayy/Cmder-Color-Themes/refs/heads/master/themes';
  THEME_FOLDER = 'https://raw.githubusercontent.com/deejayy/far-color-configurator/refs/heads/master/themes';

  currentPalette = null;
  currentTheme = null;
  paletteCatalog = [];
  themeCatalog = [];
  tooltipTimer = null;
  swatch = [];

  init = async () => {
    this.paletteCatalog = await this.loadCatalog(this.PALETTE_FOLDER).then(this.listPalettes);
    this.themeCatalog = await this.loadCatalog(this.THEME_FOLDER).then(this.listThemes);
    this.loadPaletteFromURL('./monokai.xml');
    this.loadThemeFromURL('./default.farconfig');
    this.generateAnsi256Palette();

    this.bindHover();
    this.bindClick();
    this.bindColorChange();
    this.bindColorHover();
    this.resetColorPicker();
  };

  resetColorPicker = () => {
    const colorPicker = document.getElementById('color-picker');
    colorPicker.value = '#808080';
  };

  getColorUsers = (colorClass, layer) => {
    const color = colorClass;
    const users = this.currentTheme.filter((i) => i[layer] === color).map((i) => i.name);
    return users.length > 0 ? users.join('<br>') : undefined;
  };

  bindColorHover = () => {
    document.querySelectorAll('.boxes').forEach((el) => {
      el.addEventListener('mouseover', (event) => {
        clearTimeout(this.tooltipTimer);
        if (
          event.target.classList.contains('cbox') ||
          event.target.classList.contains('acbox') ||
          event.target.classList.contains('swatch')
        ) {
          this.tooltipTimer = setTimeout(() => {
            const tooltip = document.getElementById('tooltip');
            const layer = event.target.closest('.boxes').classList.contains('fg') ? 'fg' : 'bg';
            const users = event.target.closest('.swatches')
              ? this.getColorUsers(event.target.dataset.title, layer)
              : this.getColorUsers(event.target.classList[1].replace('c', ''), layer);
            if (users) {
              tooltip.innerHTML = users;
              tooltip.style.left = `${event.pageX + 10}px`;
              tooltip.style.top = `${event.pageY + 10}px`;
              tooltip.style.display = 'block';
            }
          }, 250);
        }
      });

      el.addEventListener('mouseout', () => {
        clearTimeout(this.tooltipTimer);
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'none';
      });
    });
  };

  showAnsi = (layer) => {
    const elem = document.querySelector(`#${layer}-ansicolors`);
    elem.style.display = elem.style.display === 'flex' ? 'none' : 'flex';
  };

  showSwatches = (layer) => {
    const elem = document.querySelector(`#${layer}-swatches`);
    elem.style.display = elem.style.display === 'flex' ? 'none' : 'flex';
  };

  generateAnsi256Palette = () => {
    const rainbow = Array.from({ length: 6 }).map((_, rowIndex) => {
      return `<div class="ansi-block">${Array.from({ length: 6 })
        .map((_, colIndex) => {
          return `<div class="ansi-line">${Array.from({ length: 6 })
            .map((_, subIndex) => {
              return `<div class="acbox c${((rowIndex * 6 + colIndex) * 6 + subIndex + 16).toString(16).toUpperCase()}"></div>`;
            })
            .join('')}</div>`;
        })
        .join('')}</div>`;
    });

    const grayscale = Array.from({ length: 24 }).map((_, index) => {
      const grayValue = (index + 232).toString(16).toUpperCase();
      return `<div class="ansi-line"><div class="acbox c${grayValue}"></div></div>`;
    });

    document.querySelectorAll('.rainbow').forEach((e) => (e.innerHTML = rainbow.join('')));
    document.querySelectorAll('.grayscale').forEach((e) => (e.innerHTML = grayscale.join('')));
  };

  selectFg = (fg) => {
    document.querySelectorAll('#fg-colors .selected').forEach((el) => el.classList.remove('selected'));
    document.querySelectorAll('#fg-ansicolors .selected').forEach((el) => el.classList.remove('selected'));
    document.querySelectorAll('#fg-swatches .selected').forEach((el) => el.classList.remove('selected'));

    if (parseInt(fg, 16) < 16) {
      document.querySelector(`#fg-colors .c${fg}`).classList.add('selected');
    } else if (fg.startsWith('#')) {
      const swatch = document.querySelector(`#fg-swatches .swatch[data-title="${fg}"]`);
      if (swatch) {
        swatch.classList.add('selected');
      } else {
        console.warn(`Swatch for color ${fg} not found.`);
      }
    } else {
      document.querySelector(`#fg-ansicolors .c${fg}`)?.classList.add('selected');
    }
  };

  selectBg = (bg) => {
    document.querySelectorAll('#bg-colors .selected').forEach((el) => el.classList.remove('selected'));
    document.querySelectorAll('#bg-ansicolors .selected').forEach((el) => el.classList.remove('selected'));
    document.querySelectorAll('#bg-swatches .selected').forEach((el) => el.classList.remove('selected'));

    if (parseInt(bg, 16) < 16) {
      document.querySelector(`#bg-colors .c${bg}`).classList.add('selected');
    } else if (bg.startsWith('#')) {
      const swatch = document.querySelector(`#bg-swatches .swatch[data-title="${bg}"]`);
      if (swatch) {
        swatch.classList.add('selected');
      } else {
        console.warn(`Swatch for color ${bg} not found.`);
      }
    } else {
      document.querySelector(`#bg-ansicolors .c${bg}`)?.classList.add('selected');
    }
  };

  updateUsedColors = () => {
    const usedFgColors = new Set();
    const usedBgColors = new Set();

    this.currentTheme.forEach((item) => {
      if (item.fg) usedFgColors.add(`${item.fg}`);
      if (item.bg) usedBgColors.add(`${item.bg}`);
    });

    document.querySelectorAll('.fg .cbox').forEach((el) => {
      el.classList.remove('used');
      if (usedFgColors.has(el.classList[1].replace('c', ''))) {
        el.classList.add('used');
      }
    });

    document.querySelectorAll('.bg .cbox').forEach((el) => {
      el.classList.remove('used');
      if (usedBgColors.has(el.classList[1].replace('c', ''))) {
        el.classList.add('used');
      }
    });

    document.querySelectorAll('.fg .acbox').forEach((el) => {
      el.classList.remove('used');
      if (usedFgColors.has(el.classList[1].replace('c', ''))) {
        el.classList.add('used');
      }
    });

    document.querySelectorAll('.bg .acbox').forEach((el) => {
      el.classList.remove('used');
      if (usedBgColors.has(el.classList[1].replace('c', ''))) {
        el.classList.add('used');
      }
    });

    document.querySelectorAll('#fg-swatches .swatch').forEach((el) => {
      el.classList.remove('used');
      if (usedFgColors.has(el.dataset.title)) {
        el.classList.add('used');
      }
    });

    document.querySelectorAll('#bg-swatches .swatch').forEach((el) => {
      el.classList.remove('used');
      if (usedBgColors.has(el.dataset.title)) {
        el.classList.add('used');
      }
    });
  };

  selectColors = (fg, bg) => {
    fg && this.selectBg(bg);
    bg && this.selectFg(fg);
    this.updateUsedColors();
  };

  getHoveredToken = (event) => {
    const classes = [...event.target.classList];
    if (classes.includes('c')) {
      return classes.filter((c) => c != 'c').join('.');
    } else {
      return 'None';
    }
  };

  bindHover = () => {
    document.querySelector('pre').addEventListener('mousemove', (event) => {
      const hovered = document.getElementById('hovered');
      hovered.textContent = this.getHoveredToken(event);
    });
  };

  selectColorByToken = (tokenName) => {
    const selected = document.getElementById('selected');
    selected.textContent = tokenName;
    const fg = this.currentTheme.find((i) => i.name === selected.textContent)?.fg;
    const bg = this.currentTheme.find((i) => i.name === selected.textContent)?.bg;
    this.selectColors(fg, bg);
  };

  bindClick = () => {
    document.querySelector('pre').addEventListener('click', (event) => {
      const tokenName = this.getHoveredToken(event);
      this.selectColorByToken(tokenName);
    });
  };

  removeUnusedSwatches = () => {
    const usedColors = new Set();

    this.currentTheme.forEach((item) => {
      if (item.fg) usedColors.add(`${item.fg}`);
      if (item.bg) usedColors.add(`${item.bg}`);
    });

    this.swatch = this.swatch.filter((color) => usedColors.has(color));

    this.createSwatches();
    this.updateUsedColors();
  };

  bindColorChange = () => {
    document.querySelectorAll('.cbox').forEach((el) => {
      el.addEventListener('click', (event) => {
        const color = event.target.classList[1];
        const layer = event.target.closest('.colorboxes').id.replace(/-colors$/, '');
        const selected = document.getElementById('selected');
        const item = this.currentTheme.find((i) => i.name === selected.textContent);
        if (selected.textContent !== 'None') {
          item[layer] = color.replace('c', '');
        }
        this.selectColors(item.fg, item.bg);
        this.applyTheme(this.currentTheme);
      });
    });

    document.querySelectorAll('.ansiboxes').forEach((el) => {
      el.addEventListener('click', (event) => {
        const color = event.target.classList[1];
        const layer = event.target.closest('.ansiboxes').id.replace(/-ansicolors$/, '');
        const selected = document.getElementById('selected');
        const item = this.currentTheme.find((i) => i.name === selected.textContent);
        if (selected.textContent !== 'None') {
          item[layer] = color.replace('c', '');
        }
        this.selectColors(item.fg, item.bg);
        this.applyTheme(this.currentTheme);
      });
    });

    document.querySelectorAll('.swatches').forEach((el) => {
      el.addEventListener('click', (event) => {
        const layer = event.target.closest('.fg') ? 'fg' : 'bg';
        const selected = document.getElementById('selected');
        const color = event.target.dataset.title;
        if (color?.startsWith('#')) {
          this.currentTheme.find((i) => i.name === selected.textContent)[layer] = color;
          this.applyTheme(this.currentTheme);
        }
      });
    });
  };

  parseColor = (color) => {
    return color
      .slice(2)
      .toUpperCase()
      .split(/(..)/)
      .reverse()
      .filter((e) => e !== '')
      .join('');
  };

  loadCatalog = async (url) => {
    const response = await fetch(`${url}/Descript.ion`);
    if (!response.ok) {
      throw new Error(`Error fetching theme catalog: ${response.statusText}`);
    }

    const data = await response.text();
    const lines = data.split('\n').filter((line) => line.trim());
    const catalog = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Match quoted filename or unquoted filename followed by description
      const match = trimmed.match(/^"([^"]+)"\s+(.*)$/) || trimmed.match(/^(\S+)\s+(.*)$/);

      if (match) {
        const [, filename, description] = match;

        // Skip descript.ion file
        if (filename.toLowerCase() === 'descript.ion') continue;

        catalog.push({
          file: filename,
          desc: description.trim(),
        });
      }
    }

    return catalog;
  };

  listPalettes = (catalog) => {
    catalog.forEach(({ file, desc }) => {
      const paletteList = document.getElementById('palettes');
      const paletteDiv = document.createElement('div');
      paletteDiv.className = 'palette-name';
      paletteDiv.innerHTML = `${file} <span class="desc">(${desc})</span>`;
      paletteDiv.addEventListener('click', () => {
        this.loadPaletteFromGithub(file);
      });
      paletteList.appendChild(paletteDiv);
    });

    return catalog;
  };

  loadPaletteFromURL = async (url) => {
    const paletteFile = await fetch(url)
      .then((response) => response.text())
      .catch((error) => {
        console.error('Error loading palette:', error);
      });

    this.applyPalette(this.parseConEmuPalette(paletteFile));
  };

  loadPaletteFromGithub = async (file) => {
    const url = `${this.PALETTE_FOLDER}/${file}`;
    await this.loadPaletteFromURL(url);
  };

  parseConEmuPalette = (xmlContents) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContents, 'text/xml');

    const colors = [
      ...xmlDoc.querySelectorAll("key[name='.Vanilla'] > value[name^='ColorTable'], key[name='Palette1'] > value[name^='ColorTable']"),
    ];

    const palette = colors.reduce((acc, color) => {
      const colorIndex = parseInt(color.getAttribute('name').replace('ColorTable', ''));
      if (colorIndex > 15) return acc;

      const key = color.getAttribute('name').replace('ColorTable', 'c');
      const value = this.parseColor(color.getAttribute('data'));

      acc[key] = `#${value}`;
      return acc;
    }, {});

    return palette;
  };

  applyPalette = (palette) => {
    this.currentPalette = palette;
    const root = document.documentElement;
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  };

  listThemes = (catalog) => {
    catalog.forEach(({ file, desc }) => {
      const themeList = document.getElementById('official-themes');
      const themeDiv = document.createElement('div');
      themeDiv.className = 'theme-name';
      themeDiv.innerHTML = `${file} <span class="desc">(${desc})</span>`;
      themeDiv.addEventListener('click', () => {
        this.loadThemeFromGithub(file);
      });
      themeList.appendChild(themeDiv);
    });

    return catalog;
  };

  loadThemeFromURL = async (url) => {
    const themeFile = await fetch(url)
      .then((response) => response.text())
      .catch((error) => {
        console.error('Error loading theme:', error);
      });

    this.applyTheme(this.parseFarconfig(themeFile));
  };

  loadThemeFromGithub = async (file) => {
    const url = `${this.THEME_FOLDER}/${file}`;
    await this.loadThemeFromURL(url);
  };

  parseFarColor = (color, flags, layer) => {
    let colorResult;
    if (flags.includes(`${layer}index`)) {
      if (color === 'FF800000') {
        colorResult = layer === 'bg' ? '00' : '07';
      } else {
        colorResult = color.slice(-2).replace(/\?/, 'x');
      }
    } else {
      colorResult = `#${this.parseColor(color)}`;
    }

    return colorResult;
  };

  parseFarconfig = (farconfigContents) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(farconfigContents, 'text/xml');

    const objects = xmlDoc.querySelectorAll('colors > object');

    const result = Array.from(objects).map((obj) => {
      const name = obj.getAttribute('name');
      const background = obj.getAttribute('background');
      const foreground = obj.getAttribute('foreground');
      const flags = obj.getAttribute('flags') || '';
      const bg = this.parseFarColor(background, flags, 'bg');
      const fg = this.parseFarColor(foreground, flags, 'fg');

      if (fg.startsWith('#')) {
        this.swatch.push(fg);
      }

      if (bg.startsWith('#')) {
        this.swatch.push(bg);
      }

      return { name, bg, fg };
    });

    this.swatch = [...new Set(this.swatch)].sort((a, b) => this.getHueValueFromRGB(a) - this.getHueValueFromRGB(b));

    return result;
  };

  getHueValueFromRGB = (hexColor) => {
    if (!/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(hexColor)) {
      return 0;
    }

    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue;

    if (max === min) {
      hue = 0;
    } else {
      const delta = max - min;
      if (max === r) {
        hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        hue = ((b - r) / delta + 2) * 60;
      } else {
        hue = ((r - g) / delta + 4) * 60;
      }
    }

    return hue;
  };

  createSwatches = () => {
    const fgSwatchContainer = document.getElementById('fg-swatches');
    const bgSwatchContainer = document.getElementById('bg-swatches');
    fgSwatchContainer.innerHTML = '';
    bgSwatchContainer.innerHTML = '';

    this.swatch.forEach((color) => {
      const swatchDiv = document.createElement('div');
      swatchDiv.className = 'swatch';
      swatchDiv.style.color = color;
      swatchDiv.dataset.title = color;
      fgSwatchContainer.appendChild(swatchDiv.cloneNode(true));
      bgSwatchContainer.appendChild(swatchDiv);
    });

    const picker = document.createElement('div');
    picker.className = 'picker';
    picker.style.color = 'white';
    picker.textContent = '+ Add';
    const fgPicker = picker.cloneNode(true);
    const bgPicker = picker.cloneNode(true);
    fgPicker.addEventListener('click', () => {
      document.querySelector('#color-picker').click();
    });
    bgPicker.addEventListener('click', () => {
      document.querySelector('#color-picker').click();
    });
    fgSwatchContainer.appendChild(fgPicker);
    bgSwatchContainer.appendChild(bgPicker);
  };

  addSwatchColor = (event) => {
    this.swatch.push(event.target.value);
    this.createSwatches();
    this.updateUsedColors();
  };

  applyTheme = (theme) => {
    this.currentTheme = theme;
    const root = document.documentElement;
    theme.forEach(({ name, fg, bg }) => {
      if (fg !== undefined) {
        const fgValue = fg.startsWith('#') ? fg : `var(--x${fg})`;
        root.style.setProperty(`--fg-${name.replace(/\./g, '-')}`, fgValue);
      }
      if (bg !== undefined) {
        const bgValue = bg.startsWith('#') ? bg : `var(--x${bg})`;
        root.style.setProperty(`--bg-${name.replace(/\./g, '-')}`, bgValue);
      }
    });

    this.createSwatches();

    const selected = document.getElementById('selected');
    if (selected.textContent !== 'None') {
      this.selectColorByToken(selected.textContent);
    }

    this.updateUsedColors();
  };

  browseAndLoadFile = (acceptedExtensions, callback) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedExtensions;
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          callback(e.target.result);
          input.remove();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  importTheme = () => {
    this.browseAndLoadFile('.farconfig', (content) => {
      this.applyTheme(this.parseFarconfig(content));
    });
  };

  importPalette = () => {
    this.browseAndLoadFile('.xml', (content) => {
      this.applyPalette(this.parseConEmuPalette(content));
    });
  };

  stringifyFarColor = (color) => {
    if (!color) return { color: null, isIndex: false };

    if (color.startsWith('#')) {
      const hexValue = color.slice(1).toUpperCase();
      const reversedHex = hexValue.match(/../g).reverse().join('');
      return { color: `${reversedHex}`, isIndex: false };
    } else if (color === '0x') {
      return { color: 'FF00000?', isIndex: true };
    } else {
      return { color: `FF0000${color}`, isIndex: true };
    }
  };

  saveFile = (filename, content) => {
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  exportTheme = () => {
    const configLines = this.currentTheme.map(({ name, fg, bg }) => {
      const { color: foreground, isIndex: isFgIndex } = this.stringifyFarColor(fg);
      const { color: background, isIndex: isBgIndex } = this.stringifyFarColor(bg);
      return `<object name="${name}"${background ? ` background="${isBgIndex ? '' : 'FF'}${background}"` : ''}${
        foreground ? ` foreground="${isFgIndex ? '' : 'FF'}${foreground}"` : ''
      } flags="${[isFgIndex ? 'fgindex' : '', isBgIndex ? 'bgindex' : ''].join(' ')} inherit"/>`;
    });

    const exportContent = `<?xml version="1.0" encoding="UTF-8"?>\n<farconfig>\n    <colors>\n        ${configLines.join(
      '\n        ',
    )}\n    </colors>\n</farconfig>`;
    this.saveFile('FarThemer.farconfig', exportContent);
  };

  exportPalette = () => {
    const paletteLines = Object.entries(this.currentPalette).map(([key, value]) => {
      return `<value name="ColorTable${key.slice(1)}" type="dword" data="00${this.stringifyFarColor(value).color.toLowerCase()}" />`;
    });

    const exportContent = `<key name="Palette1" modified="${new Date().toISOString()}">
  <value name="Name" type="string" data="FarThemer"/>
  <value name="ExtendColors" type="hex" data="00"/>
  <value name="ExtendColorIdx" type="hex" data="0e"/>
  <value name="TextColorIdx" type="hex" data="10"/>
  <value name="BackColorIdx" type="hex" data="10"/>
  <value name="PopTextColorIdx" type="hex" data="10"/>
  <value name="PopBackColorIdx" type="hex" data="10"/>
  ${paletteLines.join('\n  ')}\n</key>`;
    this.saveFile('FarThemer.xml', exportContent);
  };
}
