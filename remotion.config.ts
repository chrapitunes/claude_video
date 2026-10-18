import { Config } from '@remotion/cli/config';

Config.setEntryPoint('remotion/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setConcurrency(2);
// Use the Chromium headless shell that ships with this environment.
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
