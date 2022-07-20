const WebTorrent = require('webtorrent')
const cliProgress = require("cli-progress");
const inquirer = require('inquirer');
const fs = require('fs');

const client = new WebTorrent()
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_grey);

async function stream2buffer(stream) {
    return new Promise((resolve, reject) => {
        const _buf = [];
        stream.on("data", (chunk) => _buf.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(_buf)));
        stream.on("error", (err) => reject(err));
    });
}

async function downloadFile(magnetURI) {
    return new Promise(resolve => {
        client.add(magnetURI, async function (torrent) {
            console.log('Downloading file...')
            console.log('Client is downloading:', torrent.infoHash)
            bar.start(100, 0);
            setInterval(() => {
                bar.update(torrent.progress * 100);
            }, 1000);

            await Promise.all(
                torrent.files.map(async (file) => {
                    const reader = file.createReadStream();
                    const buffer = await stream2buffer(reader);
                    fs.writeFileSync(`./downloads/${file.name}`, buffer);
                })
            );
            bar.stop();
            resolve()
        })
    })
}

async function askForMagnetURI(message) {
    const { magnetURI } = await inquirer.prompt([{
        type: 'input',
        name: 'magnetURI',
        message: message || 'Enter the magnet URI'
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