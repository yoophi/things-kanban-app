type ReactGrabImporter = () => Promise<unknown>;

const loaderKey = Symbol.for("things-kanban.storybook.react-grab");

type LoaderGlobal = typeof globalThis & {
  [loaderKey]?: Promise<void>;
};

export function initializeReactGrab(
  importer: ReactGrabImporter = () => import("react-grab"),
) {
  const target = globalThis as LoaderGlobal;
  target[loaderKey] ??= importer()
    .then(() => undefined)
    .catch(() => undefined);
  return target[loaderKey];
}

export function resetReactGrabLoaderForTests() {
  delete (globalThis as LoaderGlobal)[loaderKey];
}
