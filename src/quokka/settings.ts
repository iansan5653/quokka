const userProperties = PropertiesService.getUserProperties();

interface SettingAccessor<T> {
  get(): T;
  set(value: T): void;
}

interface ValueTransformer<T> {
  toT: (str: string | null) => T;
  fromT: (t: T) => string;
}

const stringTransformer: ValueTransformer<string> = {
  toT: (str) => str ?? "",
  fromT: (t) => t,
};

function SettingAccessor<T>(
  key: string,
  { toT, fromT }: ValueTransformer<T>
): SettingAccessor<T> {
  const get = () => toT(userProperties.getProperty(key));
  const set = (value: T) => userProperties.setProperty(key, fromT(value));
  return { get, set };
}

export const githubAccessToken = SettingAccessor(
  "githubAccessToken",
  stringTransformer
);
