import crypto from "crypto";

export const generateTaggedUrl = (pageUrl: string) => {
    const hash = crypto.createHash('sha256').update(pageUrl).digest('hex');
    const tag = [`bluniversal-${hash.slice(0, 43)}`];
    return tag;
};