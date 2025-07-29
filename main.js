export default class Configurator {
  PALETTE_FOLDER = 'https://raw.githubusercontent.com/deejayy/Cmder-Color-Themes/refs/heads/master/themes';
  THEME_FOLDER = 'https://raw.githubusercontent.com/deejayy/far-color-configurator/refs/heads/master/themes';

  currentPalette = null;
  currentTheme = null;
  paletteCatalog = [];
  themeCatalog = [];

  init = async () => {
    this.paletteCatalog = await this.loadCatalog(this.PALETTE_FOLDER).then(this.listPalettes);
    this.themeCatalog = await this.loadCatalog(this.THEME_FOLDER).then(this.listThemes);
    this.loadPaletteFromURL('./monokai.xml');
    this.loadThemeFromURL('./default.farconfig');

    this.bindHover();
    this.bindClick();
    this.bindColorChange();
  };

  selectFg = (fg) => {
    document
      .querySelector('#fg-colors')
      .querySelectorAll('.selected')
      .forEach((el) => el.classList.remove('selected'));
    document.querySelector('#fg-colors').querySelector(`.c${fg}`).classList.add('selected');
  };

  selectBg = (bg) => {
    document
      .querySelector('#bg-colors')
      .querySelectorAll('.selected')
      .forEach((el) => el.classList.remove('selected'));
    document.querySelector('#bg-colors').querySelector(`.c${bg}`).classList.add('selected');
  };

  selectColors = (fg, bg) => {
    fg && this.selectBg(bg);
    bg && this.selectFg(fg);
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

  bindClick = () => {
    document.querySelector('pre').addEventListener('click', (event) => {
      const selected = document.getElementById('selected');
      selected.textContent = this.getHoveredToken(event);
      const fg = this.currentTheme.find((i) => i.name === selected.textContent)?.fg;
      const bg = this.currentTheme.find((i) => i.name === selected.textContent)?.bg;
      this.selectColors(fg, bg);
    });
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

      return { name, bg: this.parseFarColor(background, flags, 'bg'), fg: this.parseFarColor(foreground, flags, 'fg') };
    });

    return result;
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
