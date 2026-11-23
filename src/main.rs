use aerolyze::{analyze, AnalysisRules, ProductionBatch};
use std::error::Error;
use std::fmt::Display;
use std::io::{self, Write};
use std::process::ExitCode;

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            let stderr = io::stderr();
            let mut output = stderr.lock();
            if writeln!(output, "Erro: {error}").is_err() {
                return ExitCode::FAILURE;
            }
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<(), Box<dyn Error>> {
    let arguments = std::env::args_os()
        .skip(1)
        .map(|argument| {
            argument.into_string().map_err(|_| {
                io::Error::new(
                    io::ErrorKind::InvalidInput,
                    "os argumentos devem usar caracteres Unicode",
                )
            })
        })
        .collect::<Result<Vec<_>, _>>()?;

    match arguments.first().map(String::as_str) {
        None | Some("--help") | Some("-h") | Some("ajuda") => {
            print_help()?;
            Ok(())
        }
        Some("analisar") => analyze_arguments(&arguments[1..]),
        Some(command) => Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("comando desconhecido: {command}"),
        )
        .into()),
    }
}

fn print_help() -> Result<(), io::Error> {
    let stdout = io::stdout();
    let mut output = stdout.lock();
    writeln!(output, "Aerolyze - análise de conformidade de lotes")?;
    writeln!(output)?;
    writeln!(output, "Uso:")?;
    writeln!(
        output,
        "  aerolyze analisar <quantidade> <defeituosos> <horas> <temperatura-C> <pressao-bar>"
    )?;
    writeln!(output, "  aerolyze --help")?;
    writeln!(output)?;
    writeln!(output, "Exemplo:")?;
    writeln!(output, "  aerolyze analisar 100 2 2 200 6.5")
}

fn analyze_arguments(arguments: &[String]) -> Result<(), Box<dyn Error>> {
    if arguments.len() != 5 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "informe quantidade, defeituosos, horas, temperatura-C e pressao-bar",
        )
        .into());
    }

    let batch = ProductionBatch {
        quantity: parse_value(&arguments[0], "quantidade")?,
        defective: parse_value(&arguments[1], "defeituosos")?,
        hours: parse_value(&arguments[2], "horas")?,
        temperature_celsius: parse_value(&arguments[3], "temperatura-C")?,
        pressure_bar: parse_value(&arguments[4], "pressao-bar")?,
    };
    let metrics = analyze(&batch, &AnalysisRules::default())?;

    let stdout = io::stdout();
    let mut output = stdout.lock();
    writeln!(output, "Status: {}", metrics.status)?;
    writeln!(
        output,
        "Produtividade: {:.2} peças/hora",
        metrics.productivity_per_hour
    )?;
    writeln!(
        output,
        "Taxa de defeitos: {:.2}%",
        metrics.defect_rate_percent
    )?;
    writeln!(output, "Eficiência: {:.2}%", metrics.efficiency_percent)?;
    writeln!(output, "Conformidade: {:.2}%", metrics.conformity_percent)?;
    writeln!(
        output,
        "Previsão de falhas: {:.2}%",
        metrics.failure_prediction_percent
    )?;
    Ok(())
}

fn parse_value<T>(value: &str, field: &str) -> Result<T, io::Error>
where
    T: std::str::FromStr,
    T::Err: Display,
{
    value.parse().map_err(|error| {
        io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("valor invalido para {field}: {error}"),
        )
    })
}
