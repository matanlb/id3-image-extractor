import program from 'commander';
import extractImages from './commands/extract';

const setTrue = () => true;

program
  .version('0.0.1-beta');

program.command('extract [albums...]')
  .alias('ex')
  .description('run cover art image extraction for the one or more albums')
  .option('-p --path <path>', 'Music library path (overrides MUSIC_FOLDER env var)')
  .option('-o --override', 'override existing images', setTrue)
  .option('-a --artist', 'extract for all albums of artist (provide artist\\s name instead)', setTrue)
  .option('-g --global [value]', 'ignore parameter, extract for all albums in library')
  .action((albums, params) => {
    const options = {
      override: params.override,
      global: params.global,
      path: params.path || process.env.MUSIC_LIBRARY,
    };

    if (!options.global) {
      options[params.artist ? 'artists' : 'albums'] = albums;
    }

    return extractImages(options.path, options)
      .then(result => {
        console.log('');
        console.log('Extraction completed successfully!');
        console.log(`${result.created}\t albums cover art extracted`);
        console.log(`${result.skipped}\t albums already had cover art (skipped)`);
        if (result.noImage) console.log(`${result.noImage}\t albums did not have any song with embedded cover art`);
      })
      .catch(error => {
        console.error('An unexpected error has occurred');
        console.error(error.stack);
      });
  });

program.command('set-metadata [songName]')
  .alias('set')
  .description('set id3 tags for specified song')
  .option('-p --path <path>', 'Music library path (overrides MUSIC_FOLDER env var)')
  .option('-m --min', 'set only supprted tags and remove all other', setTrue)
  .option('-b --album', 'set metadata for song in album (provide album name instead)', setTrue)
  .option('-a --artist', 'set metadata for all artist\'s songs (provide artist name instead)', setTrue)
  .option('-g --global', 'ignore prameter, set metadata for all songs in library', setTrue)
  .action((/* song, options */) => {
    // TODO: implement
  });

program.parse(process.argv);
