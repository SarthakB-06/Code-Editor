import { DocumentModel } from "./document.model.js";

export type RoomDocument = {
  roomId: string;
  code: string;
  version: number;
};

const pendingSaveTimers = new Map<string, NodeJS.Timeout>();
const latestPending = new Map<string, RoomDocument>();

export const getOrCreateDocument = async (
  roomId: string,
): Promise<RoomDocument> => {
  const doc = await DocumentModel.findOneAndUpdate(
    { roomId },
    { $setOnInsert: { roomId, code: "", version: 0 } },
    { upsert: true, new: true },
  )
    .lean()
    .exec();

  if (!doc) {
    return { roomId, code: "", version: 0 };
  }

  const d = doc as { roomId: string; code?: string; version?: number };

  return {
    roomId: d.roomId,
    code: d.code ?? "",
    version: d.version ?? 0,
  };
};

export const saveDocument = async (input: RoomDocument) => {
  await DocumentModel.updateOne(
    { roomId: input.roomId },
    { $set: { code: input.code, version: input.version } },
    { upsert: true },
  );
};

export const scheduleDocumentSave = (input: RoomDocument, debounceMs = 500) => {
  latestPending.set(input.roomId, input);

  const existing = pendingSaveTimers.get(input.roomId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    pendingSaveTimers.delete(input.roomId);

    const latest = latestPending.get(input.roomId);
    if (!latest) return;

    try {
      await saveDocument(latest);
    } catch (err) {
      // Don't crash the server for persistence issues; keep realtime working.
      console.error("Failed to save document", { roomId: latest.roomId, err });
    }
  }, debounceMs);

  pendingSaveTimers.set(input.roomId, timer);
};
