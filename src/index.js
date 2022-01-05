import domready from "domready"
import "./style.css"
import getRandomPalette from "./getRandomPalette";
import Color from "./Color";
import weightedRandom from "./weightedRandom";

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

const black = Color.from("#16161d")


function fractal(p0, p1, depth)
{
    const { x: x0, y: y0 } = p0;
    const { x: x1, y: y1 } = p1;

    let midX = (x0 + x1)/2
    let midY = (y0 + y1)/2

    let dx = (y1 - y0)
    let dy = -(x1 - x0)
    if (depth > 7)
    {
        return
    }

    const len = Math.sqrt(dx*dx+dy*dy)

    const l = (-0.5 + Math.random()) * len * 0.2
    dx = dx * l / len
    dy = dy * l / len


    midX = Math.floor(midX + dx)
    midY = Math.floor(midY + dy)

    const mid = {
        x: midX, y: midY,
        next: p1
    };
    p0.next = mid

    fractal(p0, mid, depth + 1)
    fractal(mid, p1, depth + 1)
}


function fractalChain()
{
    const { max, width, height } = config

    const cx = width / 2;
    const cy = height / 2;


    const angle = Math.random() * TAU

    const ca = Math.cos(angle);
    const sa = Math.sin(angle);

    let x0 = 0 | (cx + ca * max)
    let y0 = 0 | (cy + sa * max)
    let x1 = 0 | (cx - ca * max)
    let y1 = 0 | (cy - sa * max)

    if (y0 > y1)
    {
        let tmp = x0
        x0 = x1
        x1 = tmp

        tmp = y0
        y0 = y1
        y1 = tmp
    }

    const p1 = {x: x1, y: y1}
    const p0 = {x: x0, y: y0, next: p1}
    fractal(p0, p1, 0)


    p0.end = p1


    return p0;
}


function hitCount(curr, sqx, sqy, size)
{
    let hits = 0
    while (curr)
    {
        const {x,y} = curr

        if (x >= sqx && x < sqx + size && y >= sqy && y < sqy + size)
        {
            hits++
        }

        curr = curr.next
    }
    return hits;
}



function dumpChain(curr)
{
    let s = ""
    while (curr)
    {
        const {x,y} = curr

        s += "(" + x + " x " + y + ") "

        curr = curr.next
    }
    console.log(s)
}


const randomEmoji = weightedRandom([
    1, () => "♥",
    1, () => "💔",
    1, () => "💕",
    1, () => " ",
])

domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        const max = Math.sqrt(width * width + height * height) * 0.5 // XXX: 0.5
        config.max = max


        function paint()
        {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, width, height);

            const palette = getRandomPalette(Math.random(), p => p.length >= 4)

            if (palette.length === 4)
            {
                palette.push("#000")
            }
            shuffle(palette)

            let off = 0
            const bg0 = palette[off++]
            const bg1 = palette[off++]
            const fg0 = palette[off++]
            const fg1 = palette[off++]

            const gradient = ctx.createLinearGradient(0, 0, 0, height)
            gradient.addColorStop(0, Color.from(bg0).mix(black, 0.2).toRGBHex())
            gradient.addColorStop(1, Color.from(bg1).mix(black, 0.2).toRGBHex())
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, width, height)

            const size = Math.min(width, height) * 0.618;
            const cx = width / 2;
            const cy = height / 2;
            let sqx = cx - size / 2;
            let sqy = cy - size / 2;

            const gradient2 = ctx.createLinearGradient(0, sqy, 0, sqy + size)
            gradient2.addColorStop(0, fg0)
            gradient2.addColorStop(1, fg1)

            const gradient3 = ctx.createLinearGradient(0, sqy, 0, sqy + size)
            gradient3.addColorStop(0, palette[0|Math.random()*palette.length])
            gradient3.addColorStop(1, palette[0|Math.random()*palette.length])

            const tmp = document.createElement("canvas")
            tmp.width = width;
            tmp.height = height;
            /**
             * @type CanvasRenderingContext2D
             */
            let tmpCtx = tmp.getContext("2d")

            const tmp2 = document.createElement("canvas")
            tmp2.width = width;
            tmp2.height = height;
            /**
             * @type CanvasRenderingContext2D
             */
            let tmp2Ctx = tmp2.getContext("2d")

            tmpCtx.clearRect(0, 0, width, height)
            tmpCtx.fillStyle = gradient2
            tmpCtx.fillRect(sqx, sqy, size, size)

            tmpCtx.fillStyle = gradient3
            tmpCtx.font = (0 | (height / 2)) + "px sans-serif"

            const emoji = randomEmoji();
            const tm = tmpCtx.measureText(emoji);
            tmpCtx.fillText(emoji, 0|(cx - tm.width / 2), 0|(cy + height/5))

            const numCuts = 1 + Math.random() * 5;

            const rmax = TAU / 16

            const cut = (ctx, ctx2) => {

                ctx2.clearRect(0, 0, width, height)
                let chain;
                do
                {
                    chain = fractalChain(cx, cy);
                } while (hitCount(chain, sqx, sqy, size) < 8)

                dumpChain(chain)

                const {x: x0, y: y0} = chain
                const {x: x1, y: y1} = chain.end

                const a0 = Math.atan2(cy - y0, cx - x0)
                const a1 = Math.atan2(cy - y1, cx - x1)

                let dx = (y1 - y0)
                let dy = -(x1 - x0)
                const len = Math.sqrt(dx * dx + dy * dy);

                dx = -dx / len
                dy = -dy / len
                const offset = 1 + Math.pow(Math.random(), 3) * 40

                let curr = chain
                ctx2.save()

                ctx.translate(width/2, height/2)
                ctx.rotate(Math.random() * rmax - rmax/2);
                ctx.translate(-width/2, -height/2)

                ctx2.beginPath()
                ctx2.moveTo(curr.x - dx * offset, curr.y - dy * offset)
                curr = curr.next
                while (curr)
                {
                    ctx2.lineTo(curr.x - dx * offset, curr.y - dy * offset)
                    curr = curr.next
                }
                ctx2.arc(cx, cy, max, a0, a1, true)
                ctx2.clip()

                ctx2.drawImage(ctx.canvas, -dx * offset, -dy * offset)

                ctx2.restore()

                curr = chain.next
                ctx2.save()

                ctx2.translate(width/2, height/2)
                ctx2.rotate(Math.pow(Math.random(),3) * rmax - rmax/2);
                ctx2.translate(-width/2, -height/2)

                ctx2.beginPath()
                ctx2.moveTo(curr.x + dx * offset, curr.y + dy * offset)
                while (curr)
                {

                    ctx2.lineTo(curr.x + dx * offset, curr.y + dy * offset)
                    curr = curr.next
                }
                ctx2.arc(cx, cy, max, a0, a1, false)
                ctx2.clip()

                ctx2.drawImage(ctx.canvas, dx * offset, dy * offset)

                ctx.restore()

            };

            ctx.strokeStyle = "#f0f"
            tmp2Ctx.strokeStyle = "#f0f"
            for (let i = 0; i < numCuts; i++)
            {
                cut(tmpCtx, tmp2Ctx)

                let tmp = tmpCtx
                tmpCtx = tmp2Ctx
                tmp2Ctx = tmp
            }
            ctx.drawImage(tmp2Ctx.canvas, 0, 0)
        }


        paint();

        canvas.addEventListener("click", paint, true)

    }
);
