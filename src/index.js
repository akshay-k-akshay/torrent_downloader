const WebTorrent = require('webtorrent')
const cliProgress = require("cli-progress");
const inquirer = require('inquirer');
const path = require('path');

const client = new WebTorrent()
const bar = new cliProgress.SingleBar({
    format: ' \x1b[90m{bar} \x1b[0m{percentage}% | ETA: {eta}s | {speed}'
}, cliProgress.Presets.shades_grey);

function getSpeed(bytes) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}/s`
}

async function downloadFile(magnetURI) {
    return new Promise(resolve => {
        client.add(magnetURI, {
            path: process.env.DOWNLOADS || path.join(__dirname, "../downloads")
        }, async function (torrent) {
            bar.start(100, 0, {
                speed: "N/A"
            });
            setInterval(() => {
                bar.update(torrent.progress * 100, {
                    speed: getSpeed(torrent.downloadSpeed)
                });
            }, 1000);
            torrent.on('done', () => {
                console.log('\nTorrent finished downloading')
                bar.stop();
                resolve()
            })
        })
    })
}

async function askForMagnetURI() {
    const { magnetURI } = await inquirer.prompt([{
        type: 'input',
        name: 'magnetURI',
        message: 'Enter the magnet URI'
    }])
    if (!magnetURI) {
        console.log('No magnet URI provided. Exiting...')
        process.exit(1)
    }
    return magnetURI
}

async function main() {
    try {
        const magnetURI = await askForMagnetURI()
        await downloadFile(magnetURI)
        process.exit(0)
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

main()