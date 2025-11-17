import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const todosRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    return [{ hello: "world" }];
  }),
});
