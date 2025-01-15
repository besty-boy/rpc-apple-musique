import { exec } from 'child_process';
import { Client } from 'discord-rpc';


const CLIENT_ID = 'VOTRE_CLIENT_ID';


function getMusicInfo(): Promise<{ name: string, artist: string, album: string, duration: number, position: number } | null> {
    return new Promise((resolve, reject) => {
        const script = `
        tell application "Music"
            if player state is playing then
                set trackName to name of current track
                set trackArtist to artist of current track
                set trackAlbum to album of current track
                set trackDuration to duration of current track
                set trackPosition to player position
                return {trackName, trackArtist, trackAlbum, trackDuration, trackPosition}
            else
                return {}
            end if
        end tell
        `;
        
        exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur dans osascript: ${error}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`Erreur dans osascript (stderr): ${stderr}`);
                reject(stderr);
                return;
            }
            
            const info = stdout.trim().split(',');
            if (info.length > 0) {
                resolve({
                    name: info[0].trim(),
                    artist: info[1].trim(),
                    album: info[2].trim(),
                    duration: parseFloat(info[3].trim()),
                    position: parseFloat(info[4].trim())
                });
            } else {
                resolve(null); 
            }
        });
    });
}


const rpc = new Client({ transport: 'ipc' });

rpc.on('ready', async () => {
    console.log('RPC Discord connecté.');

    try {
        setInterval(async () => {
            const musicInfo = await getMusicInfo();
            if (musicInfo) {
                
                rpc.setActivity({
                    details: musicInfo.name,
                    state: `par ${musicInfo.artist}`,
                    startTimestamp: Math.floor(Date.now() / 1000) - musicInfo.position,
                    largeImageKey: 'apple_music_logo',  
                    largeImageText: 'Apple Music',
                    smallImageKey: 'play',  
                    smallImageText: 'En lecture',
                    instance: true
                });

                console.log(`En lecture : ${musicInfo.name} - ${musicInfo.artist}`);
            } else {
                rpc.clearActivity();
                console.log('Aucune musique en cours');
            }
        }, 15000);  
    } catch (error) {
        console.error('Erreur lors de la mise à jour du Rich Presence :', error);
    }
});

rpc.login({ clientId: CLIENT_ID }).catch(console.error);
