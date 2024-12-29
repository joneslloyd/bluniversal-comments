import React, { useEffect } from "react";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import { maybeInitializeDevModeAgent } from "../utils";

interface DevModeAgentContainerProps {
  agentManager: BlueskyAgentManager;
}

const DevModeAgentContainer: React.FC<DevModeAgentContainerProps> = ({
  agentManager,
}) => {
  useEffect(() => {
    maybeInitializeDevModeAgent(agentManager);
  }, [agentManager]);

  return null;
};

export default DevModeAgentContainer;
