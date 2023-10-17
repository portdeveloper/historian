import { Address } from "viem";
import { AddressInput } from "~~/components/scaffold-eth";

interface NavbarProps {
  searchedAddress: Address;
  setSearchedAddress: React.Dispatch<React.SetStateAction<string>>;
}

export const Navbar = ({ searchedAddress, setSearchedAddress }: NavbarProps) => {
  return (
    <div className="navbar sticky top-0 z-20 grid min-h-0 flex-shrink-0 grid-cols-12 justify-between bg-base-100 px-0 shadow-md shadow-secondary sm:px-2 lg:static">
      <div className="col-start-4 flex flex-row items-center md:col-start-1 md:col-end-3">
        <div className="mb-4 text-4xl">👀</div>
        <h1 className="ml-2 text-2xl font-bold">address.vision</h1>
      </div>
      <div className="col-start-2 col-end-12 row-start-2 flex justify-center md:col-start-4 md:col-end-10 md:row-auto">
        <div className="flex-grow">
          <AddressInput
            placeholder="Enter an Ethereum address or ENS name to get started"
            value={searchedAddress}
            onChange={setSearchedAddress}
          />
        </div>
      </div>
      <div className="col-start-11 col-end-13">{/* Additional content, perhaps history?*/}</div>
    </div>
  );
};