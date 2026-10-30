export const fixture = {
  calls: [],
  waiting: [],
  deferred: false,
  result: { data: { user: {}, session: {} }, error: null },
  logout: "success",
  router: null,
};
window.authFixture = fixture;
const signIn = (method) => {
  fixture.calls.push(method);
  return fixture.deferred
    ? new Promise((resolve, reject) =>
        fixture.waiting.push({ resolve, reject }),
      )
    : Promise.resolve(fixture.result);
};
export const authClient = {
  signIn: {
    email: () => signIn("password"),
    social: () => signIn("github"),
    passkey: () => signIn("passkey"),
  },
  signOut: async () => {
    fixture.calls.push("logout");
    if (fixture.logout === "throw") throw new Error("fixture network failure");
    if (fixture.logout === "error")
      return { data: null, error: { message: "PRIVATE fixture server error" } };
    if (fixture.logout === "deferred")
      return new Promise((resolve, reject) =>
        fixture.waiting.push({ resolve, reject }),
      );
    return { data: { success: true }, error: null };
  },
  $fetch: async () => ({ data: null, error: null }),
  $store: { notify() {} },
};
