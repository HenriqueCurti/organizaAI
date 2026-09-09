import QRCode from "qrcode";

interface PixOptions {
  key: string;
  name: string;
  city?: string;
  amount?: number;
  txId?: string;
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function normalizeText(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toUpperCase()
    .slice(0, maxLength);
}

export function generatePixPayload({
  key,
  name,
  city = "BRASILIA",
  amount,
  txId = "***",
}: PixOptions): string {
  const cleanKey = key.trim();
  const cleanName = normalizeText(name || "ORGANIZADOR", 25);
  const cleanCity = normalizeText(city || "BRASILIA", 15);
  const cleanTxId = txId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "***";

  // Subcampos do Merchant Account Info (ID 26)
  const gui = emvField("00", "BR.GOV.BCB.PIX");
  const keyField = emvField("01", cleanKey);
  const merchantAccountInfo = emvField("26", `${gui}${keyField}`);

  // Subcampo do Additional Data (ID 62)
  const txIdField = emvField("05", cleanTxId);
  const additionalData = emvField("62", txIdField);

  let payload =
    emvField("00", "01") + // Payload Format Indicator
    merchantAccountInfo +
    emvField("52", "0000") + // Merchant Category Code
    emvField("53", "986") + // Moeda Real (BRL)
    (amount && amount > 0 ? emvField("54", amount.toFixed(2)) : "") +
    emvField("58", "BR") + // País
    emvField("59", cleanName) + // Nome
    emvField("60", cleanCity) + // Cidade
    additionalData +
    "6304"; // Indicador de CRC16

  const checksum = crc16(payload);
  return `${payload}${checksum}`;
}

export async function generatePixQrCode(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 2,
    width: 280,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
