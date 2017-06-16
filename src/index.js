import _ from 'lodash';
import minimist from 'minimist';
import id3Reader from 'node-id3';

import readLibrary from './libraryReader';

const { r, root } = minimist(process.argv.slice(2));
const rootPath = root || r || process.env.MUSIC_FOLDER;

readLibrary(rootPath)
  .then(x => {
    console.log(JSON.stringify(x, null, '\t'));
  })
