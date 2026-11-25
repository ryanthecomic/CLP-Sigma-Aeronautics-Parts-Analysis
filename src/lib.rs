use std::error::Error;
use std::fmt;

const CAPACIDADE_NOMINAL_POR_HORA: f64 = 50.0;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ProductionBatch {
    pub quantity: u32,
    pub defective: u32,
    pub hours: f64,
    pub temperature_celsius: f64,
    pub pressure_bar: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AnalysisRules {
    pub temperature_min: f64,
    pub temperature_max: f64,
    pub pressure_min: f64,
    pub pressure_max: f64,
    pub defect_rate_optimal_max: f64,
    pub defect_rate_attention_max: f64,
    pub efficiency_optimal_min: f64,
    pub efficiency_attention_min: f64,
}

impl Default for AnalysisRules {
    fn default() -> Self {
        Self {
            temperature_min: 150.0,
            temperature_max: 250.0,
            pressure_min: 3.0,
            pressure_max: 10.0,
            defect_rate_optimal_max: 2.0,
            defect_rate_attention_max: 5.0,
            efficiency_optimal_min: 85.0,
            efficiency_attention_min: 70.0,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QualityStatus {
    Optimal,
    Attention,
    Critical,
}

impl fmt::Display for QualityStatus {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let label = match self {
            Self::Optimal => "Ótimo",
            Self::Attention => "Atenção",
            Self::Critical => "Crítico",
        };
        formatter.write_str(label)
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AnalysisMetrics {
    pub productivity_per_hour: f64,
    pub defect_rate_percent: f64,
    pub efficiency_percent: f64,
    pub conformity_percent: f64,
    pub failure_prediction_percent: f64,
    pub status: QualityStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AnalysisError {
    EmptyBatch,
    DefectsExceedQuantity,
    InvalidHours,
    InvalidTemperature,
    InvalidPressure,
    InvalidTemperatureRange,
    InvalidPressureRange,
    InvalidDefectThresholds,
    InvalidEfficiencyThresholds,
    NonFiniteMetrics,
}

impl fmt::Display for AnalysisError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::EmptyBatch => "a quantidade do lote deve ser maior que zero",
            Self::DefectsExceedQuantity => {
                "a quantidade de peças defeituosas não pode exceder o total"
            }
            Self::InvalidHours => "as horas de produção devem ser finitas e maiores que zero",
            Self::InvalidTemperature => "a temperatura deve ser um número finito",
            Self::InvalidPressure => "a pressão deve ser um número finito",
            Self::InvalidTemperatureRange => "a faixa de temperatura configurada é inválida",
            Self::InvalidPressureRange => "a faixa de pressão configurada é inválida",
            Self::InvalidDefectThresholds => "os limites de taxa de defeitos são inválidos",
            Self::InvalidEfficiencyThresholds => "os limites de eficiência são inválidos",
            Self::NonFiniteMetrics => "não foi possível calcular métricas finitas para o lote",
        };
        formatter.write_str(message)
    }
}

impl Error for AnalysisError {}

pub fn analyze(
    batch: &ProductionBatch,
    rules: &AnalysisRules,
) -> Result<AnalysisMetrics, AnalysisError> {
    validate_rules(rules)?;
    validate_batch(batch)?;

    let defect_rate_percent =
        round_two((f64::from(batch.defective) / f64::from(batch.quantity)) * 100.0)?;
    let productivity_per_hour = round_two(f64::from(batch.quantity) / batch.hours)?;
    let efficiency_percent = round_two(
        ((f64::from(batch.quantity) / (batch.hours * CAPACIDADE_NOMINAL_POR_HORA)) * 100.0)
            .clamp(0.0, 100.0),
    )?;
    let conformity_percent = round_two(100.0 - defect_rate_percent)?;

    let temperature_deviation = normalized_deviation(
        batch.temperature_celsius,
        rules.temperature_min,
        rules.temperature_max,
    );
    let pressure_deviation =
        normalized_deviation(batch.pressure_bar, rules.pressure_min, rules.pressure_max);
    let failure_prediction_percent = round_two(
        (defect_rate_percent * 2.0 + (temperature_deviation + pressure_deviation) * 10.0)
            .clamp(0.0, 100.0),
    )?;

    let status = classify(defect_rate_percent, efficiency_percent, rules);

    Ok(AnalysisMetrics {
        productivity_per_hour,
        defect_rate_percent,
        efficiency_percent,
        conformity_percent,
        failure_prediction_percent,
        status,
    })
}

fn validate_batch(batch: &ProductionBatch) -> Result<(), AnalysisError> {
    if batch.quantity == 0 {
        return Err(AnalysisError::EmptyBatch);
    }
    if batch.defective > batch.quantity {
        return Err(AnalysisError::DefectsExceedQuantity);
    }
    if !batch.hours.is_finite() || batch.hours <= 0.0 {
        return Err(AnalysisError::InvalidHours);
    }
    if !batch.temperature_celsius.is_finite() {
        return Err(AnalysisError::InvalidTemperature);
    }
    if !batch.pressure_bar.is_finite() {
        return Err(AnalysisError::InvalidPressure);
    }
    Ok(())
}

fn validate_rules(rules: &AnalysisRules) -> Result<(), AnalysisError> {
    if !valid_range(rules.temperature_min, rules.temperature_max) {
        return Err(AnalysisError::InvalidTemperatureRange);
    }
    if !valid_range(rules.pressure_min, rules.pressure_max) {
        return Err(AnalysisError::InvalidPressureRange);
    }
    if !rules.defect_rate_optimal_max.is_finite()
        || !rules.defect_rate_attention_max.is_finite()
        || rules.defect_rate_optimal_max < 0.0
        || rules.defect_rate_attention_max > 100.0
        || rules.defect_rate_optimal_max > rules.defect_rate_attention_max
    {
        return Err(AnalysisError::InvalidDefectThresholds);
    }
    if !rules.efficiency_optimal_min.is_finite()
        || !rules.efficiency_attention_min.is_finite()
        || rules.efficiency_attention_min < 0.0
        || rules.efficiency_optimal_min > 100.0
        || rules.efficiency_attention_min > rules.efficiency_optimal_min
    {
        return Err(AnalysisError::InvalidEfficiencyThresholds);
    }
    Ok(())
}

fn valid_range(min: f64, max: f64) -> bool {
    let width = max - min;
    min.is_finite() && max.is_finite() && width.is_finite() && width > 0.0
}

fn normalized_deviation(value: f64, min: f64, max: f64) -> f64 {
    let half_width = (max - min) / 2.0;
    let center = min + half_width;
    (value - center).abs() / half_width
}

fn round_two(value: f64) -> Result<f64, AnalysisError> {
    let rounded = (value * 100.0).round() / 100.0;
    if rounded.is_finite() {
        Ok(rounded)
    } else {
        Err(AnalysisError::NonFiniteMetrics)
    }
}

fn classify(
    defect_rate_percent: f64,
    efficiency_percent: f64,
    rules: &AnalysisRules,
) -> QualityStatus {
    let defect_status = if defect_rate_percent <= rules.defect_rate_optimal_max {
        QualityStatus::Optimal
    } else if defect_rate_percent <= rules.defect_rate_attention_max {
        QualityStatus::Attention
    } else {
        QualityStatus::Critical
    };

    let efficiency_status = if efficiency_percent >= rules.efficiency_optimal_min {
        QualityStatus::Optimal
    } else if efficiency_percent >= rules.efficiency_attention_min {
        QualityStatus::Attention
    } else {
        QualityStatus::Critical
    };

    match (defect_status, efficiency_status) {
        (QualityStatus::Critical, _) | (_, QualityStatus::Critical) => QualityStatus::Critical,
        (QualityStatus::Attention, _) | (_, QualityStatus::Attention) => QualityStatus::Attention,
        _ => QualityStatus::Optimal,
    }
}

#[cfg(test)]
mod tests {
    use super::{analyze, AnalysisError, AnalysisRules, ProductionBatch, QualityStatus};

    fn valid_batch() -> ProductionBatch {
        ProductionBatch {
            quantity: 100,
            defective: 2,
            hours: 2.0,
            temperature_celsius: 200.0,
            pressure_bar: 6.5,
        }
    }

    #[test]
    fn calculates_metrics_and_classifies_valid_batch() {
        let metrics = analyze(&valid_batch(), &AnalysisRules::default());

        assert_eq!(
            metrics,
            Ok(super::AnalysisMetrics {
                productivity_per_hour: 50.0,
                defect_rate_percent: 2.0,
                efficiency_percent: 100.0,
                conformity_percent: 98.0,
                failure_prediction_percent: 4.0,
                status: QualityStatus::Optimal,
            })
        );
    }

    #[test]
    fn rejects_empty_batch() {
        let batch = ProductionBatch {
            quantity: 0,
            ..valid_batch()
        };

        assert_eq!(
            analyze(&batch, &AnalysisRules::default()),
            Err(AnalysisError::EmptyBatch)
        );
    }

    #[test]
    fn rejects_more_defects_than_pieces() {
        let batch = ProductionBatch {
            defective: 101,
            ..valid_batch()
        };

        assert_eq!(
            analyze(&batch, &AnalysisRules::default()),
            Err(AnalysisError::DefectsExceedQuantity)
        );
    }

    #[test]
    fn rejects_non_finite_measurements() {
        let batch = ProductionBatch {
            temperature_celsius: f64::NAN,
            ..valid_batch()
        };

        assert_eq!(
            analyze(&batch, &AnalysisRules::default()),
            Err(AnalysisError::InvalidTemperature)
        );
    }

    #[test]
    fn reports_the_worst_classification() {
        let batch = ProductionBatch {
            defective: 10,
            hours: 4.0,
            ..valid_batch()
        };
        let metrics = analyze(&batch, &AnalysisRules::default());

        assert_eq!(
            metrics.map(|result| result.status),
            Ok(QualityStatus::Critical)
        );
    }
}
