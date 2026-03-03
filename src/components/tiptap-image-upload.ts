/**
 * TipTap extension that lets users drag-and-drop or paste images directly
 * into the editor.  The file is uploaded using the shared `uploadImage`
 * helper (dev → local filesystem, prod → GitHub) and inserted as a
 * standard `<img>` node.
 */
import { Extension } from "@tiptap/vue-3";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { uploadImage } from "../lib/upload";

export interface ImageUploadOptions {
  /** Called after a successful upload so the host can show a toast, etc. */
  onUpload?: (url: string) => void;
  /** Called when an upload fails. */
  onError?: (error: Error) => void;
}

const imageUploadKey = new PluginKey("imageUpload");

/**
 * Extract image Files from a DataTransfer (drag-drop or paste).
 */
const getImageFiles = (data: DataTransfer): File[] =>
  Array.from(data.files).filter((f) => f.type.startsWith("image/"));

export const ImageUpload = Extension.create<ImageUploadOptions>({
  name: "imageUpload",

  addOptions() {
    return {
      onUpload: undefined,
      onError: undefined,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const editorView = this.editor;

    const handleFiles = async (files: File[], posOrNull?: number) => {
      for (const file of files) {
        // Show a temporary placeholder while uploading
        const placeholderSrc = URL.createObjectURL(file);
        const pos =
          posOrNull ?? editorView.state.selection.anchor;

        editorView
          .chain()
          .focus()
          .insertContentAt(pos, {
            type: "image",
            attrs: { src: placeholderSrc, alt: file.name },
          })
          .run();

        try {
          const url = await uploadImage(file);

          // Replace the blob placeholder with the real URL
          const { doc, tr } = editorView.state;
          doc.descendants((node, nodePos) => {
            if (
              node.type.name === "image" &&
              node.attrs.src === placeholderSrc
            ) {
              tr.setNodeMarkup(nodePos, undefined, {
                ...node.attrs,
                src: url,
              });
            }
          });
          editorView.view.dispatch(tr);

          options.onUpload?.(url);
        } catch (err) {
          // Remove the placeholder on failure
          const { doc, tr } = editorView.state;
          doc.descendants((node, nodePos) => {
            if (
              node.type.name === "image" &&
              node.attrs.src === placeholderSrc
            ) {
              tr.delete(nodePos, nodePos + node.nodeSize);
            }
          });
          editorView.view.dispatch(tr);

          options.onError?.(
            err instanceof Error ? err : new Error("Upload failed"),
          );
        } finally {
          URL.revokeObjectURL(placeholderSrc);
        }
      }
    };

    return [
      new Plugin({
        key: imageUploadKey,
        props: {
          handleDrop(view, event) {
            if (!event.dataTransfer) return false;
            const files = getImageFiles(event.dataTransfer);
            if (files.length === 0) return false;
            event.preventDefault();

            const coords = { left: event.clientX, top: event.clientY };
            const pos = view.posAtCoords(coords)?.pos;

            void handleFiles(files, pos);
            return true;
          },

          handlePaste(_view, event) {
            if (!event.clipboardData) return false;
            const files = getImageFiles(event.clipboardData);
            if (files.length === 0) return false;
            event.preventDefault();

            void handleFiles(files);
            return true;
          },
        },
      }),
    ];
  },
});
