
from decimal import Decimal

def compute_pnl(direction: str, entry_price: Decimal, exit_price: Decimal, position_size: Decimal, fees: Decimal = Decimal(0)) -> Decimal:
    if direction == "long":
        pnl = (exit_price - entry_price) * position_size - fees
    else:
        pnl = (entry_price - exit_price) * position_size - fees
    return pnl


def compute_return_percent(pnl_money: Decimal, balance_before: Decimal) -> Decimal:
    if balance_before == 0:
        return Decimal(0)
    return (pnl_money / balance_before) * Decimal(100)


def compute_risk_percent(entry_price: Decimal, stop_loss: Decimal, position_size: Decimal, balance_before: Decimal) -> Decimal:
    risk_money = abs(entry_price - stop_loss) * position_size
    if balance_before == 0:
        return Decimal(0)
    return (risk_money / balance_before) * Decimal(100)
