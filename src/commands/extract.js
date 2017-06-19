/**
 * Created by matan on 6/19/17.
 */
import _ from 'lodash';

import readLibrary from '../libraryReader';
import { newProgressBar, KNOWN_EXTENSION } from '../util';
import * as FilesHelper from '../fileHelper';

const defaultOptions = {
  musicExtensions: KNOWN_EXTENSION,
  metadataLoadConcurrency: 10,
};

function extractImage(album) {
  const songWithImageIndex = _.findIndex(album.songs, song => !_.isEmpty(_.get(song, 'metadata.tags.picture')));
  if (songWithImageIndex === -1) return null;

  const songWithImage = album.songs[songWithImageIndex];
  const imageData = songWithImage.metadata.tags.picture;

  const imagePath = `${album.path}/${album.name}.${_.last(imageData.format.split('/'))}`;
  FilesHelper.createFile(imagePath, imageData.data);
  album.coverArt = imagePath;

  return imagePath;
}

export default function extractImages(libraryPath, options) {
  options = _.assign({}, defaultOptions, options);
  let loadingBar;
  let writingBar;
  const library = {};

  return readLibrary(libraryPath, KNOWN_EXTENSION)
    // Save to scope variable
    .then(musicLibrary => {
      _.assign(library, musicLibrary);
      return library.songs;
    })
    // Init loading progress bar
    .tap(songs => {
      loadingBar = newProgressBar(songs.length, 'Reading metadata:', true);
    })
    // load songs metadata. update progress bar on each song completion
    .each(song => FilesHelper.loadSongMetadata(song).tap(loadingBar.tick.bind(loadingBar)),
      { concurrency: options.metadataLoadConcurrency })
    // Filter only albums with missing images
    .then(() => _.filter(library.albums, album => _.isNil(album.coverArt)))
    // Init image creation progress bar if have albums with no cover
    .tap(noCoverAlbums => {
      writingBar = noCoverAlbums.length && newProgressBar(noCoverAlbums.length, 'Creating images:', true);
    })
    // Writing images from metadata to files (count file created)
    .map(noCoverAlbum => {
      noCoverAlbum.coverArt = extractImage(noCoverAlbum);
      writingBar.tick();
      return !_.isNil(noCoverAlbum.coverArt);
    })
    // split count and report result
    .then(result => _.partition(result, _.identity))
    .then(([hadSourceImage, noSourceImage]) => ({
      skipped: library.albums.length - (hadSourceImage.length + noSourceImage.length),
      created: hadSourceImage.length,
      noImage: noSourceImage.length,
    }));
}