import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Calculation {
    id: bigint;
    subType: SubType;
    resultN: number;
    studyType: StudyType;
    timestamp: bigint;
    inputDescription: string;
}
export enum StudyType {
    descriptive = "descriptive",
    clinicalTrial = "clinicalTrial",
    analytic = "analytic"
}
export enum SubType {
    parallelRct = "parallelRct",
    nonInferiorityTrial = "nonInferiorityTrial",
    compareTwoMeans = "compareTwoMeans",
    estimateMean = "estimateMean",
    crossoverTrial = "crossoverTrial",
    estimateProportion = "estimateProportion",
    compareTwoProportionsCaseControl = "compareTwoProportionsCaseControl",
    compareTwoProportionsCohort = "compareTwoProportionsCohort"
}
export interface backendInterface {
    getCalculationById(id: bigint): Promise<Calculation>;
    getRecentCalculations(): Promise<Array<Calculation>>;
    saveCalculation(studyType: StudyType, subType: SubType, inputDescription: string, resultN: number, timestamp: bigint): Promise<void>;
}
