<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="GitHub Sync"
    :style="{ width: 'min(820px, 96vw)' }"
    :contentStyle="{ overflow: 'auto' }"
  >
    <div class="space-y-6">
      <div class="rounded-2xl border border-white/70 bg-white/60 p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-sm font-extrabold text-[color:var(--color-ink)]">
              Repository connection
            </div>
            <div class="text-xs font-semibold text-[color:var(--color-ink-soft)]">
              Changes made in production will commit to this repository.
            </div>
          </div>
          <Tag
            :value="ready ? 'Connected' : 'Not configured'"
            :severity="ready ? 'success' : 'warning'"
            class="!rounded-full"
          />
        </div>

        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Owner</label>
            <InputText v-model="form.owner" placeholder="e.g. your-github-username" />
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Repository</label>
            <InputText v-model="form.repo" placeholder="e.g. linkable" />
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Branch</label>
            <InputText v-model="form.branch" placeholder="main" />
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Uploads directory</label>
            <InputText v-model="form.uploadsDir" placeholder="public/uploads" />
            <span class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
              Image uploads will be stored in this path.
            </span>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Data file path</label>
            <InputText v-model="form.dataPath" placeholder="cms-data.json" />
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Static data path</label>
            <InputText v-model="form.staticDataPath" placeholder="public/data.json" />
            <span class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
              Optional second file to keep your exported JSON in sync.
            </span>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Committer name</label>
            <InputText v-model="form.committerName" placeholder="Linkable CMS" />
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Committer email</label>
            <InputText v-model="form.committerEmail" placeholder="cms@linkable.local" />
          </div>

          <div class="md:col-span-2 grid gap-2">
            <label class="text-xs font-bold text-[color:var(--color-ink-soft)]">Personal access token</label>
            <InputText
              v-model="form.token"
              type="password"
              placeholder="ghp_..."
              autocomplete="off"
            />
            <span class="text-[11px] font-semibold text-[color:var(--color-ink-soft)]">
              Store a token with <code>repo</code> scope. It’s saved locally in your browser.
            </span>
          </div>
        </div>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-white/70 bg-white/40 p-4 text-[13px] font-semibold text-[color:var(--color-ink-soft)]"
      >
        <div>
          <div class="font-extrabold text-[color:var(--color-ink)]">Tips</div>
          <ul class="mt-1 space-y-1 text-xs font-semibold text-[color:var(--color-ink-soft)]">
            <li>Use fine-grained PATs limited to this repository when possible.</li>
            <li>Commits run from your browser; no secrets leave your device.</li>
            <li>Keep static deployments fresh by running <code>npm run export</code> after syncing.</li>
          </ul>
        </div>

        <Button
          text
          severity="danger"
          class="!rounded-full"
          @click="clearToken"
          :disabled="!form.token"
        >
          <i class="pi pi-times" />
          <span class="ml-2">Clear token</span>
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Button rounded severity="secondary" @click="visible = false">Cancel</Button>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            rounded
            severity="secondary"
            :loading="testing"
            @click="handleTest"
            class="!rounded-full"
          >
            <i class="pi pi-shield" />
            <span class="ml-2">Test connection</span>
          </Button>
          <Button
            rounded
            class="!border-0 !bg-[color:var(--color-brand)] !px-4 !py-2.5 shadow-[0_14px_38px_rgba(37,99,235,0.22)]"
            :loading="saving"
            @click="handleSave"
          >
            <i class="pi pi-check" />
            <span class="ml-2">Save</span>
          </Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Tag from "primevue/tag";
import { useToast } from "primevue/usetoast";

import {
  loadGithubSettings,
  saveGithubSettings,
  getGithubToken,
  saveGithubToken,
  clearGithubToken,
  canUseGithubSync,
  testGithubConnection,
  type GithubSettings,
} from "../lib/github";

type FormState = GithubSettings & { token: string };

const defaultForm = (): FormState => ({
  ...loadGithubSettings(),
  token: getGithubToken(),
});

export default defineComponent({
  name: "GithubSettingsDialog",
  components: {
    Dialog,
    Button,
    InputText,
    Tag,
  },
  props: {
    open: { type: Boolean, required: true },
  },
  emits: ["update:open"],
  setup(props, { emit }) {
    const toast = useToast();

    const visible = ref(props.open);
    watch(
      () => props.open,
      (value) => (visible.value = value),
    );
    watch(visible, (value) => emit("update:open", value));

    const form = reactive<FormState>(defaultForm());
    const saving = ref(false);
    const testing = ref(false);
    const ready = ref(canUseGithubSync());

    const refreshForm = () => {
      const current = defaultForm();
      Object.assign(form, current);
      ready.value = canUseGithubSync();
    };

    const validate = () => {
      if (!form.owner.trim()) {
        throw new Error("Owner is required.");
      }
      if (!form.repo.trim()) {
        throw new Error("Repository is required.");
      }
      if (!form.branch.trim()) {
        throw new Error("Branch is required.");
      }
      if (!form.token.trim()) {
        throw new Error("Personal access token is required.");
      }
    };

    const handleSave = async () => {
      try {
        validate();
      } catch (error) {
        toast.add({
          severity: "warn",
          summary: "Missing details",
          detail: error instanceof Error ? error.message : "Fill out the required fields.",
          life: 2400,
        });
        return;
      }

      saving.value = true;
      try {
        const { token, ...settings } = form;
        saveGithubSettings(settings);
        saveGithubToken(token);
        ready.value = canUseGithubSync();
        toast.add({
          severity: "success",
          summary: "Saved",
          detail: "GitHub sync settings updated.",
          life: 2200,
        });
        visible.value = false;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to save GitHub settings.";
        toast.add({
          severity: "error",
          summary: "Save failed",
          detail: message,
          life: 3000,
        });
      } finally {
        saving.value = false;
      }
    };

    const handleTest = async () => {
      testing.value = true;
      try {
        await testGithubConnection(form, form.token);
        toast.add({
          severity: "success",
          summary: "Connection successful",
          detail: "Repository and branch are reachable.",
          life: 2200,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to reach the repository.";
        toast.add({
          severity: "error",
          summary: "Connection failed",
          detail: message,
          life: 3200,
        });
      } finally {
        testing.value = false;
      }
    };

    const clearToken = () => {
      clearGithubToken();
      form.token = "";
      ready.value = canUseGithubSync();
      toast.add({
        severity: "info",
        summary: "Token cleared",
        detail: "Add a new token to resume syncing.",
        life: 2200,
      });
    };

    watch(
      () => props.open,
      (value) => {
        if (value) refreshForm();
      },
    );

    return {
      visible,
      form,
      ready,
      saving,
      testing,
      handleSave,
      handleTest,
      clearToken,
    };
  },
});
</script>