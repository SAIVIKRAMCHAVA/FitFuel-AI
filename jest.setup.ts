// path: jest.setup.ts

// Mock Next's cache helpers so code that uses unstable_cache works in Jest
jest.mock("next/cache", () => {
  return {
    unstable_cache:
      (fn: (...args: any[]) => any) =>
      (...args: any[]) =>
        fn(...args),
    revalidateTag: jest.fn(),
    revalidatePath: jest.fn(),
  };
});
