Object.assign(process.env, { NODE_ENV: "production" });

void import("../server").catch((error) => {
  console.error(error);
  process.exit(1);
});

export {};
