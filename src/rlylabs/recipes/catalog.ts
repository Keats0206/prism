import { defineCatalog } from "./define";
import * as communicate from "./items/communicate";
import * as consume from "./items/consume";
import * as create from "./items/create";
import * as track from "./items/track";
import * as transact from "./items/transact";

/** Add new intent barrels here as the library grows. */
export const recipes = defineCatalog([
  track.habitChecklist,
  track.dayProgressHeader,
  track.workoutSetBlock,
  track.streakCard,
  track.checkInCard,
  track.nextBestAction,
  track.coachComment,
  track.beforeAfterTimeline,
  create.artifactComposer,
  create.versionStack,
  create.remixBar,
  create.assetPicker,
  create.publishShareCard,
  consume.mediaEmbedStack,
  consume.playlistPreview,
  consume.storyCarousel,
  consume.shareableCaption,
  consume.locationCard,
  consume.videoMoment,
  consume.voiceDrop,
  consume.socialPollCard,
  consume.linkDrop,
  consume.releaseTimeline,
  consume.eventTicketCard,
  consume.musicEmbedMix,
  consume.socialEngagement,
  consume.photoAlbum,
  transact.eventBooking,
  communicate.eventFaq,
]);
