import { RxMagnifyingGlass } from "react-icons/rx";
export default function SearchBar() {
  return (
    <div className="w-[90%] flex items-center justify-center mt-10">
      <div className="flex bg-primary items-center">
        <RxMagnifyingGlass />
        <input className="" />
      </div>
    </div>
  );
}
