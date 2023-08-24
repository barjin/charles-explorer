const moons = [
    "🌑 ",
    "🌒 ",
    "🌓 ",
    "🌔 ",
    "🌕 ",
    "🌖 ",
    "🌗 ",
    "🌘 "
];

function* spinnerGenerator() {
    let i = 0;
    while (true) {
        yield moons[i++ % moons.length];
    }
}

export const spinner = spinnerGenerator();