import React, { useEffect, useState } from "react";
import { fetchThread } from "./utils";

interface BskyCommentsProps {
  postUri: string;
}

const BskyComments: React.FC<BskyCommentsProps> = ({ postUri }) => {
  const [thread, setThread] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThread = async () => {
      try {
        const fetchedThread = await fetchThread(postUri);
        setThread(fetchedThread);
      } catch (err: any) {
        setError("Failed to load comments");
      }
    };
    loadThread();
  }, [postUri]);

  return (
    <div>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        thread && (
          <div>
            {thread.replies?.map((reply: any) => (
              <div key={reply.post.uri}>
                <strong>{reply.post.author.handle}</strong>
                <p>{reply.post.record.text}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default BskyComments;
