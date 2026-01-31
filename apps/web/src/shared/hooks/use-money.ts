import { useMemo } from "react";
import { useCurrency } from "./use-currency";

export function useMoneyFormatter() {
  const { data } = useCurrency();
  const currency = data?.currency ?? "BRL";
  const formatter = useMemo(() => {
    return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
  }, [currency]);

  return { currency, formatter };
}
