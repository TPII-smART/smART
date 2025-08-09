import "@rainbow-me/rainbowkit/styles.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { UserProfileProvider } from "~~/context/UserProfileContext";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "smART",
  description: "dApp for working as a freelancer in the art world",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body style={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "var(--color-primary)" }}>
        <ThemeProvider enableSystem>
          <UserProfileProvider>
            <ScaffoldEthAppWithProviders>
              <div
                className="w-full border-t border-l main-body rounded-tl-2xl"
                style={{
                  height: "93vh",
                  overflow: "auto",
                }}
              >
                {children}
              </div>
            </ScaffoldEthAppWithProviders>
          </UserProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
