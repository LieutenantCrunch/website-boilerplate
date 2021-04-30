import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import * as ClientConstants from '../constants/constants.client';
import { randomInt } from './utilityFunctions';

export const logFilters = () => {
    ffmpeg.getAvailableFilters(function(err, filters) {
        console.log("Available filters:");
        console.dir(filters);
    });
};

export const generateAudioThumbnail = async (pathName: string, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            let inputFilePath: string = path.join(pathName, fileName);
            let outputFile: string = `${fileName}.png`;
            let outputFilePath: string = `${inputFilePath}.png`;

            ffmpeg(inputFilePath)
            /* Listing the filters separately causes them to be joined with a semicolon. They need to be joined with a comma. */
            /*.complexFilter([
                'compand',
                {
                    filter: 'showwavespic', options: {s: '640x120'}
                }
            ])*/
            .complexFilter(`compand,aformat=channel_layouts=mono,showwavespic=s=${ClientConstants.AUDIO_WAVEFORM_DIMS.WIDTH}x${ClientConstants.AUDIO_WAVEFORM_DIMS.HEIGHT}:colors=#666666`)
            /* Using .frames(1) appends -vframes 1, which doesn't match the documentation and doesn't work */
            .addOutputOption('-frames:v 1')
            .save(outputFilePath)
            .on('start', (commandLine) => {
                //console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('error', (err) => {
                reject(err);
            })
            .on('end', () => {
                resolve(outputFile);
            });
        }
        catch (err) {
            reject(err);
        }
    });
};

export const generateVideoThumbnail = async (pathName: string, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        let outputFiles: string[] = [];
        let screenshotTimestamp: number = randomInt(25, 75); // This is done so they can't easily fake the thumbnail like people used to do on Youtube

        ffmpeg(path.join(pathName, fileName))
        .screenshot({
            timestamps: [`${screenshotTimestamp}%`],
            filename: '%f.png',
            folder: pathName
        })
        .on('start', (commandLine) => {
            //console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('filenames', (filenames) => {
            outputFiles = filenames;
        })
        .on('error', (err) => {
            reject(err);
        })
        .on('end', () => {
            resolve(outputFiles[0]);
        });
    });
};
