import jsmediatags from 'jsmediatags';
import Promise from 'bluebird';

export function readId3Tags(path) {
  return new Promise((resolve, reject) =>
    jsmediatags.read(path, {
      onSuccess: resolve,
      onError: reject,
    })
  );
}

export function writeTags(/* path, tags */) {
  // pending
}
