import program from 'commander';
import extractImages from './commands/extract';


program
  .version('0.0.1-beta');

program.command('extract [albumName]')
  .alias('ex')
  .description('run cover art image extraction for the album name')
  .option('-p --path', 'Music library path (overrides MUSIC_FOLDER env var)')
  .option('-o --override', 'override existing images')
  .option('-a --artist', 'extract for all alubms of artist (provide artist name instead)')
  .option('-g --global', 'ignore parmeter, extract for all albums in library')
  .action((album, options) => {
    extractImages(options.path)
      .then(result => {
        console.log('');
        console.log('Extraction completed successfully!');
        console.log(`${result.created}\t albums cover art extracted`);
        console.log(`${result.skipped}\t albums already had cover art (skipped)`);
        result.noImage && console.log(`${result.noImage}\t albums did not have any song with imbeded cover art`);
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
  .option('-m --min', 'set only supprted tags and remove all other')
  .option('-b --album', 'set metadata for song in album (provide album name instead)')
  .option('-a --artist', 'set metadata for all artist\'s songs (provide artist name instead)')
  .option('-g --global', 'ignore prameter, set metadata for all songs in library')
  .action((song, options) => {
    // TODO: implement
  });

program.parse(process.argv);
