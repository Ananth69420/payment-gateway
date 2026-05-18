export default function BankCard({ bank, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border border-gray-300 hover:border-[#2563eb] hover:bg-blue-50 transition rounded-2xl p-5 text-left w-full"
    >
      <div className="flex items-center justify-between">

        <div>
          <h3 className="text-2xl font-bold">
            {bank.name}
          </h3>

          <p className="text-gray-500 mt-2">
            Login or create a {bank.name} account.
          </p>
        </div>

        <div className="text-3xl">
          🏦
        </div>
      </div>
    </button>
  );
}