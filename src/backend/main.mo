import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import List "mo:core/List";
import Runtime "mo:core/Runtime";

actor {
  type StudyType = {
    #descriptive;
    #analytic;
    #clinicalTrial;
  };

  type SubType = {
    #estimateProportion;
    #estimateMean;
    #compareTwoProportionsCohort;
    #compareTwoProportionsCaseControl;
    #compareTwoMeans;
    #parallelRct;
    #nonInferiorityTrial;
    #crossoverTrial;
  };

  type Calculation = {
    id : Nat;
    studyType : StudyType;
    subType : SubType;
    inputDescription : Text;
    resultN : Float;
    timestamp : Int;
  };

  module Calculation {
    public func compareByTimestamp(c1 : Calculation, c2 : Calculation) : Order.Order {
      Int.compare(c2.timestamp, c1.timestamp);
    };
  };

  let calculations = List.empty<Calculation>();
  var nextId = 0;

  public shared ({ caller }) func saveCalculation(studyType : StudyType, subType : SubType, inputDescription : Text, resultN : Float, timestamp : Int) : async () {
    let calc : Calculation = {
      id = nextId;
      studyType;
      subType;
      inputDescription;
      resultN;
      timestamp;
    };

    // Add new calculation to the front
    calculations.add(calc);

    // Keep only last 20 calculations
    let calcArray = calculations.toArray();
    let limitedArray = calcArray.sliceToArray(0, Nat.min(20, calcArray.size()));

    calculations.clear();
    calculations.addAll(limitedArray.values());

    nextId += 1;
  };

  public query ({ caller }) func getRecentCalculations() : async [Calculation] {
    calculations.toArray().sort(Calculation.compareByTimestamp);
  };

  public query ({ caller }) func getCalculationById(id : Nat) : async Calculation {
    switch (calculations.toArray().find(func(c) { c.id == id })) {
      case (null) { Runtime.trap("Calculation not found") };
      case (?calc) { calc };
    };
  };
};
