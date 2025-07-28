const colorMap = {};
let palette = {};

const loadTheme = (xmlContent, noRender) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  const colors = xmlDoc.getElementsByTagName("object");
  for (let color of colors) {
    const name = color.getAttribute("name").replace(/\./gi, "-");
    let background;
    if (color.getAttribute("flags")?.includes("bgindex")) {
      if (color.getAttribute("background") === "FF800000") {
        background = "00";
      } else {
        background = color
          .getAttribute("background")
          .slice(6)
          .toUpperCase()
          .replace(/\?/g, "x");
      }
    } else {
      // rgb, not implemented yet
    }

    let foreground;
    if (color.getAttribute("flags")?.includes("fgindex")) {
      if (color.getAttribute("foreground") === "FF800000") {
        foreground = "07";
      } else {
        foreground = color
          .getAttribute("foreground")
          .slice(6)
          .toUpperCase()
          .replace(/\?/g, "x");
      }
    } else {
      // rgb, not implemented yet
    }

    if (name && background && foreground) {
      colorMap[name] = {
        background: `c${background}`,
        foreground: `c${foreground}`,
      };
    }
  }

  if (!noRender) {
    renderColorMap(colorMap);
  }
};

const loadPalette = (xmlContent) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
  
  const colors = [
    ...xmlDoc.querySelectorAll(
      "key[name='.Vanilla'] > value[name^='ColorTable'], key[name='Palette1'] > value[name^='ColorTable']"
    ),
  ];
  // create an object with keys c01, c02, etc. with the color value from "data" attribute (leading zeroes are removed)
  palette = colors.reduce((acc, color) => {
    const key = color.getAttribute("name").replace("ColorTable", "c");
    const value = color
      .getAttribute("data")
      .slice(2)
      .toUpperCase()
      .split(/(..)/)
      .reverse()
      .filter((e) => e !== "")
      .join("");
    acc[key] = `#${value}`;
    return acc;
  }, {});

  const root = document.documentElement;
  Object.keys(palette).forEach((key) => {
    root.style.setProperty(`--${key}`, palette[key]);
  });
};

const exportPalette = () => {
  const exportContent = `<?xml version="1.0" encoding="UTF-8"?>
<key name="Palette1" modified="${new Date().toISOString()}">
  <value name="Name" type="string" data="FarThemer"/>
  <value name="ExtendColors" type="hex" data="00"/>
  <value name="ExtendColorIdx" type="hex" data="0e"/>
  <value name="TextColorIdx" type="hex" data="10"/>
  <value name="BackColorIdx" type="hex" data="10"/>
  <value name="PopTextColorIdx" type="hex" data="10"/>
  <value name="PopBackColorIdx" type="hex" data="10"/>
  ${Object.entries(palette)
    .map(
      ([key, value]) =>
        `<value name="ColorTable${key.slice(1)}" type="dword" data="${value
          .slice(1)
          .toUpperCase()}"/>`
    )
    .join("\n  ")}
</key>
`;
  const blob = new Blob([exportContent], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ConEmuPalette.xml";
  document.body.appendChild(a);
  a.click();
};

const renderColorMap = (myColorMap) => {
  const root = document.documentElement;

  Object.keys(myColorMap).forEach((key) => {
    const { background, foreground } = myColorMap[key];
    root.style.setProperty(`--bg-${key}`, `var(--${background})`);
    root.style.setProperty(`--fg-${key}`, `var(--${foreground})`);
  });
};

const getHoveredToken = (event) => {
  const classes = [...event.target.classList];
  if (classes.includes("c")) {
    return classes.filter((c) => c != "c").join(".");
  } else {
    return "None";
  }
};

const selectFg = (fg) => {
  document
    .querySelector("#fg-colors")
    .querySelectorAll(".selected")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelector("#fg-colors")
    .querySelector(`.${fg}`)
    .classList.add("selected");
};

const selectBg = (bg) => {
  document
    .querySelector("#bg-colors")
    .querySelectorAll(".selected")
    .forEach((el) => el.classList.remove("selected"));
  document
    .querySelector("#bg-colors")
    .querySelector(`.${bg}`)
    .classList.add("selected");
};

const selectColors = (fg, bg) => {
  selectBg(bg);
  selectFg(fg);
};

const exportTheme = () => {
  const exportContent = `<?xml version="1.0" encoding="UTF-8"?>
<farconfig>
  <colors>
    ${Object.entries(colorMap)
      .map(
        ([name, { background, foreground }]) =>
          `<object name="${name.replace(
            /-/g,
            "."
          )}" background="FF0000${background
            .slice(1)
            .replace(/x/, "?")}" foreground="FF0000${foreground
            .slice(1)
            .replace(/x/, "?")}" flags="fgindex bgindex inherit"/>`
      )
      .join("\n    ")}
  </colors>
</farconfig>
`;
  const blob = new Blob([exportContent], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "FarThemer.farconfig";
  document.body.appendChild(a);
  a.click();
};

const importTheme = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".farconfig";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadTheme(e.target.result);
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

const importPalette = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xml";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadPalette(e.target.result);
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

const loadThemeFromURL = async (url, noRender) => {
  if (url !== "./default.farconfig") {
    await loadThemeFromURL("./default.farconfig", true);
  }

  await fetch(url)
    .then((response) => response.text())
    .then((themeContent) => loadTheme(themeContent, noRender))
    .catch((error) => console.error("Error loading theme:", error));
};

const loadThemeFromGithub = (title) => {
  const url = `https://raw.githubusercontent.com/FarGroup/FarManager/refs/heads/master/extra/Addons/Colors/Interface/${title}.farconfig`;
  loadThemeFromURL(url);
};

const loadThemes = () => {
  fetch(
    "https://raw.githubusercontent.com/FarGroup/FarManager/refs/heads/master/extra/Addons/Colors/Interface/Descript.ion"
  )
    .then((response) => response.text())
    .then((data) => {
      const themes = data
        .split(/[\r\n]/)
        .filter((e) => e.match(/\.farconfig/))
        .map((e) => e.split(/\.farconfig/).map((e) => e.trim()));

      themes.forEach(([title, desc]) => {
        const themeList = document.getElementById("official-themes");
        const themeDiv = document.createElement("div");
        themeDiv.className = "theme-name";
        themeDiv.innerHTML = `${title} <span class="desc">(${desc})</span>`;
        themeDiv.addEventListener("click", () => {
          loadThemeFromGithub(title);
        });
        themeList.appendChild(themeDiv);
      });
    })
    .catch((error) => console.error("Error loading themes:", error));
};

// palette list location: https://raw.githubusercontent.com/deejayy/Cmder-Color-Themes/refs/heads/master/themes/Descript.ion
const loadPalettes = () => {
  fetch(
    "https://raw.githubusercontent.com/deejayy/Cmder-Color-Themes/refs/heads/master/themes/Descript.ion"
  )
    .then((response) => response.text())
    .then((data) => {
      const palettes = data
        .split(/[\r\n]/)
        .filter((e) => e.match(/\.xml/))
        .map((e) => e.split(/\.xml/).map((e) => e.trim().replace(/"/g, "")));

      palettes.forEach(([title, desc]) => {
        const paletteList = document.getElementById("palettes");
        const paletteDiv = document.createElement("div");
        paletteDiv.className = "palette-name";
        paletteDiv.innerHTML = `${title} <span class="desc">(${desc})</span>`;
        paletteDiv.addEventListener("click", () => {
          loadPaletteFromGithub(title);
        });
        paletteList.appendChild(paletteDiv);
      });
    })
    .catch((error) => console.error("Error loading palettes:", error));
};

const loadPaletteFromURL = async (url) => {
  await fetch(url)
    .then((response) => response.text())
    .then((paletteContent) => loadPalette(paletteContent))
    .catch((error) => console.error("Error loading palette:", error));
};

const loadPaletteFromGithub = (title) => {
  const url = `https://raw.githubusercontent.com/deejayy/Cmder-Color-Themes/refs/heads/master/themes/${title}.xml`;
  loadPaletteFromURL(url);
};

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("pre").addEventListener("mousemove", (event) => {
    const hovered = document.getElementById("hovered");
    hovered.textContent = getHoveredToken(event);
  });

  document.querySelector("pre").addEventListener("click", (event) => {
    const selected = document.getElementById("selected");
    selected.textContent = getHoveredToken(event).replace(/\./g, "-");
    const fg = colorMap[selected.textContent].foreground;
    const bg = colorMap[selected.textContent].background;
    selectColors(fg, bg);
  });

  document.querySelectorAll(".cbox").forEach((el) => {
    el.addEventListener("click", (event) => {
      console.log("Color box clicked:", event.target.classList);

      const color = event.target.classList[1];
      const layer =
        event.target.closest(".colorboxes").id.replace(/-colors$/, "") === "bg"
          ? "background"
          : "foreground";
      const selected = document.getElementById("selected");
      if (selected.textContent !== "None") {
        colorMap[selected.textContent][layer] = color;
      }
      selectColors(
        colorMap[selected.textContent].foreground,
        colorMap[selected.textContent].background
      );
      renderColorMap(colorMap);
    });
  });

  loadThemes();
  loadPalettes();
  loadThemeFromURL("./default.farconfig");
  loadPaletteFromURL("./monokai.xml");
});
