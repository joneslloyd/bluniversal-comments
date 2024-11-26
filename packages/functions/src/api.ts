import { Resource } from 'sst';
import { Handler } from 'aws-lambda';
import { BskyAgent } from '@atproto/api';
import { createNewPost } from './utils';

interface PostCreatorProps {
  url: string;
  title: string;
}

export const handler: Handler<PostCreatorProps, {
    statusCode: number;
    body: string;
}> = async (event) => {
  const { url, title } = event;

const agent = new BskyAgent({
  service: 'https://bsky.social'
});

await agent.login({
  identifier: Resource.BsUsername.value,
  password: Resource.BsPassword.value
});

const did = agent?.did;

if(!did) {
    return {
        statusCode: 500,
        body: "No DID found."
    };
}

const postContent = createNewPost(url, title);
const { uri } = await agent.post({
  ...postContent,
  createdAt: new Date().toISOString()
})

  return {
    statusCode: 200,
    body: uri
  };
};
