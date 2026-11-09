import { WaAccountsProvider } from "./wa-accounts-context";

export default function WhatsAppLayout({ children }) {
  return (
    <WaAccountsProvider>
      <div className="flex flex-col h-full">{children}</div>
    </WaAccountsProvider>
  );
}
