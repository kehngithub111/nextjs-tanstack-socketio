import { DynamicInput } from "@/components/dynamic/dynamic-input";
import { QueryDemo } from "@/components/query/query-demo";

export default function Home() {
  return (
    <>
      <div className="p-4">
        <DynamicInput label="sample" placeholder="Sample" path="sample.data" />
        <QueryDemo />
      </div>
    </>
  );
}
