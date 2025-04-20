if (!window.solana) {
  alert("Solana wallet not found. Please open in Phantom or a Solana-compatible wallet browser.");
}

const { Connection, PublicKey, clusterApiUrl } = solanaWeb3;
const anchor = window.anchor;

const PROGRAM_ID = new PublicKey("7DoZcPeRdnmMwCyTPEi7k4g9YHUv4LjkKVTUcLfNT7of");

const IDL = {
  version: "0.1.0",
  name: "coldieviz",
  instructions: [
    {
      name: "makeWish",
      accounts: [
        { name: "wishAccount", isMut: true, isSigner: true },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "wish", type: "string" }]
    }
  ],
  accounts: [
    {
      name: "Wish",
      type: {
        kind: "struct",
        fields: [
          { name: "author", type: "publicKey" },
          { name: "wish", type: "string" }
        ]
      }
    }
  ]
};

let provider = null;
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

document.getElementById("connect-wallet").addEventListener("click", async () => {
  const status = document.getElementById("wallet-address");

  try {
    const res = await window.solana.connect();
    status.textContent = `Connected: ${res.publicKey.toString()}`;

    provider = new anchor.AnchorProvider(
      connection,
      window.solana,
      anchor.AnchorProvider.defaultOptions()
    );
    anchor.setProvider(provider);
  } catch (err) {
    console.error("Wallet connection failed:", err);
    status.textContent = "Connection failed.";
  }
});

document.getElementById("submit-wish").addEventListener("click", async () => {
  const result = document.getElementById("result");
  const wishText = document.getElementById("wish-title").value.trim();

  if (!provider || !provider.wallet.publicKey) {
    alert("Connect your wallet first.");
    return;
  }

  if (!wishText) {
    alert("Please enter a wish.");
    return;
  }

  const program = new anchor.Program(IDL, PROGRAM_ID, provider);
  const wishAccount = anchor.web3.Keypair.generate();

  try {
    const tx = await program.methods
      .makeWish(wishText)
      .accounts({
        wishAccount: wishAccount.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .signers([wishAccount])
      .rpc();

    const li = document.createElement("li");
    li.textContent = wishText;
    document.getElementById("wish-list").appendChild(li);
    document.getElementById("wish-title").value = "";

    result.innerHTML = `Wish submitted!<br><a href="https://explorer.solana.com/tx/${tx}?cluster=devnet" target="_blank">View transaction</a>`;
  } catch (err) {
    console.error("Submit error:", err);
    result.textContent = "Something went wrong while submitting.";
  }
});
