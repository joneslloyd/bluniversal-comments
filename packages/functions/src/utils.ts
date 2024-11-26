import { AppBskyFeedPost, AppBskyRichtextFacet } from "@atproto/api";
import { generateTaggedUrl } from "@bluniversal-comments/core/utils";

export const formRecordPayload = async (
  pageUrl: string,
  pageTitle: string,
): Promise<Partial<AppBskyFeedPost.Record>> => {
  const text = `Discussing "${pageTitle}"\n${pageUrl}\n\n#BlueskyComments`;

  const facets: AppBskyRichtextFacet.Main[] = [];

  const urlIndices = getByteIndices(text, pageUrl);
  if (urlIndices) {
    facets.push({
      index: urlIndices,
      features: [
        {
          $type: "app.bsky.richtext.facet#link",
          uri: pageUrl,
        },
      ],
    });
  }

  const hashtag = "#BlueskyComments";
  const tagIndices = getByteIndices(text, hashtag);
  if (tagIndices) {
    facets.push({
      index: tagIndices,
      features: [
        {
          $type: "app.bsky.richtext.facet#tag",
          tag: "BlueskyComments",
        },
      ],
    });
  }

  const tag = await generateTaggedUrl(pageUrl);

  return {
    text,
    facets,
    tags: [tag],
  };
};

const getByteIndices = (text: string, substring: string) => {
  const encoder = new TextEncoder();
  const substringBytes = encoder.encode(substring);

  const index = text.indexOf(substring);
  if (index === -1) {
    return null;
  }

  const preText = text.substring(0, index);
  const preTextBytes = encoder.encode(preText);
  const byteStart = preTextBytes.length;
  const byteEnd = byteStart + substringBytes.length;

  return { byteStart, byteEnd };
};
