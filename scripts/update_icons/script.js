import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import { Jimp } from "jimp";
import bufferToDataUrl from "buffer-to-data-url";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const __dirname__ = path.resolve(url.fileURLToPath(import.meta.url), "..");

const mappings = [
    {
        variable: "--theme-toggle-button",
        filename: "theme_toggle.png",
        monochrome: true,
    },
    {
        variable: "--search-toggle-button",
        filename: "search_toggle.png",
        monochrome: true,
    },
    {
        variable: "--sidebar-toggle-button",
        filename: "sidebar_toggle.png",
        monochrome: true,
    },
    {
        variable: "--print-button",
        filename: "print.png",
        monochrome: true,
    },
    {
        variable: "--github-button",
        filename: "github.png",
        monochrome: true,
    },
    {
        variable: "--git-edit-button",
        filename: "lapis.png",
        monochrome: true,
    },
    {
        variable: "--previous-button",
        filename: "previous.png",
        monochrome: true,
    },
    {
        variable: "--next-button",
        filename: "next.png",
        monochrome: true,
    },
];

const icons_root = path.resolve(__dirname__, "../../icons");
const icon_binaries = {};

for (const m of mappings) {
    icon_binaries[m.filename] = fs.readFileSync(path.resolve(icons_root, m.filename));
}

async function replace_scalable(css) {
    const section_start = "/* ===== begin scalable icons ===== */";
    const section_end = "/* ===== end scalable icons ===== */";
    let i = 0, j = 0;
    i = css.indexOf(section_start, i);
    assert(i != -1, "icon sections (===== begin/end ... =====) have a typo");
    i += section_start.length;
    j = css.indexOf(section_end, i);
    assert(j != -1, "icon sections (===== begin/end ... =====) have a typo");
    const builder = [];
    for (const m of mappings) {
        let url = "";
        if (m.filename.endsWith(".svg")) {
            const orig = icon_binaries[m.filename].toString("utf8");
            let doc = new DOMParser().parseFromString(orig, "text/xml");
            doc.documentElement.setAttribute("fill", "currentColor");
            const serialized = new XMLSerializer().serializeToString(doc);
            url = bufferToDataUrl("image/svg", Buffer.from(serialized));

            // contribute variable
            builder.push("    " + m.variable + ": url(\"" + url + "\") no-repeat center / contain;");
        }
    }
    return css.slice(0, i) + "\n\n" + builder.join("\n") + "\n\n    " + section_end + css.slice(j + section_end.length);
}

async function replace_by_color(css, label, color) {
    const section_start = "/* ===== begin "+label+" icons ===== */";
    const section_end = "/* ===== end "+label+" icons ===== */";
    let section = 0;
    s: for (;;) {
        let i = 0, j = 0;
        for (let w = 0; w <= section; w++) {
            i = css.indexOf(section_start, i);
            if (i == -1) {
                assert(section != 0, "icon sections (===== begin/end ... =====) have a typo");
                break s;
            }
            i += section_start.length;
            j = css.indexOf(section_end, i);
            if (j == -1) {
                assert(section != 0, "icon sections (===== begin/end ... =====) have a typo");
                break s;
            }
        }
        const builder = [];
        const replace_color = {
            r: (color >> 16) & 0xFF,
            g: (color >> 8) & 0xFF,
            b: color & 0xFF,
        };
        for (const m of mappings) {
            let url = "";
            if (m.filename.endsWith(".svg")) {
                //
            } else {
                // bitmap or "raster image" case
                const jimp = await Jimp.read(icon_binaries[m.filename]);
                if (m.monochrome) {
                    jimp.scan(0, 0, jimp.bitmap.width, jimp.bitmap.height, (x, y, idx) => {
                        const { data } = jimp.bitmap;
                        data[idx + 0] = replace_color.r;
                        data[idx + 1] = replace_color.g;
                        data[idx + 2] = replace_color.b;
                    });
                    url = await jimp.getBase64("image/png");
                } else {
                    url = await jimp.getBase64(jimp.mime);
                }

                // contribute variable
                builder.push("    " + m.variable + ": url(\"" + url + "\") no-repeat center / contain;");
            }
        }
        css = css.slice(0, i) + "\n\n" + builder.join("\n") + "\n\n    " + section_end + css.slice(j + section_end.length);
        section++;
    }
    return css;
}

(async () => {
    const css_path = path.resolve(__dirname__, "../../theme/css/variables.css");
    let css = fs.readFileSync(css_path, "utf-8");

    css = await replace_scalable(css);
    css = await replace_by_color(css, "black", 0x000000);
    css = await replace_by_color(css, "white", 0xFFFFFF);
    fs.writeFileSync(css_path, css);
})();