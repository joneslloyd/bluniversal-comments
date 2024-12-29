export interface TabInfo {
  url: string;
  title: string;
}

export type StatusState = {
  type: "error" | "info" | "loading" | "success";
  message: string;
  isLoading: boolean;
};

export function validateStatusState(
  statusState: any,
): statusState is StatusState {
  return (
    (statusState.type === "error" ||
      statusState.type === "info" ||
      statusState.type === "loading" ||
      statusState.type === "success") &&
    typeof statusState.message === "string" &&
    typeof statusState.isLoading === "boolean"
  );
}

export default validateStatusState;
