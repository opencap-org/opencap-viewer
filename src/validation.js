import { extend } from 'vee-validate';

extend("weightRule", {
  validate(v) {
      if (typeof v === "string" && !v.trim())
            return true;
      if (!isNaN(parseFloat(v)) && v > 0 && v <= 200.0)
            return true;
      if(!isNaN(parseFloat(v)) && v > 200.0)
          return "It seems unlikely that the subject's weight exceeds 200 kg. Please ensure that you are using the correct units. The weight should be specified in kilograms (kg)."
      if(!isNaN(parseFloat(v)) && v <= 0)
          return "The subject's weight must be greater than 0 kg."
  }
})

extend ("heightRule", {
    validate(v) {
                if (typeof v === "string" && !v.trim())
                    return true;
                if (!isNaN(parseFloat(v)) && v >= .1 && v <= 3.0)
                    return true;
                if(!isNaN(parseFloat(v)) && v > 3.0)
                    return "It seems unlikely that the subject's height exceeds 3 m. Please ensure that you are using the correct units. The height should be specified in meters (m).";
                if(!isNaN(parseFloat(v)) && v < .1)
                    return "It seems unlikely that the subject's height is less than 0.1 m. Please ensure that you are using the correct units. The height should be specified in meters (m).";
    }
})

extend("birthYearRule", {
    validate(v) {
        const currentYear = new Date().getFullYear();
        if (!v)
            return true;
        if (!isNaN(parseFloat(v)) && v >= 1900 && v <= currentYear)
            return true;
        if(!isNaN(parseFloat(v)) && v > currentYear)
            return `The subject's birth year cannot be set in the future. Please ensure that you are using the correct units. The birth year should be earlier than the current year ${currentYear} and specified in years (yyyy) format.`;
        if(!isNaN(parseFloat(v)) && v < 1900)
            return "It seems unlikely that the subject's birth year predates 1900. Please ensure that you are using the correct units. The birth year should be specified in years (yyyy) format.";
    }
})

extend("subjectTagsRule", {
    validate(v) {
        if (!v) return true;
        if (Array.isArray(v) && v.length > 0)
            return true;
        if (!Array.isArray(v))
            return "The subject tags must be contained in an array.";
        if (Array.isArray(v) && v.length == 0)
            return "You must add at least one subject tag. For subjects with no conditions, select 'Unimpaired'.";
    }
})

extend("heightRuleFt", {
    validate(v) {
        const MAX_FT = 9.84; // ~3 m
        const MIN_FT = 0.33; // ~0.1 m
        if (typeof v === "string" && !v.trim())
            return true;
        if (!isNaN(parseFloat(v)) && v >= MIN_FT && v <= MAX_FT)
            return true;
        if (!isNaN(parseFloat(v)) && v > MAX_FT)
            return "It seems unlikely that the subject's height exceeds 9.84 ft. Please ensure that you are using the correct units. The height should be specified in feet (ft).";
        if (!isNaN(parseFloat(v)) && v < MIN_FT)
            return "It seems unlikely that the subject's height is less than 0.33 ft. Please ensure that you are using the correct units. The height should be specified in feet (ft).";
    }
})

extend("weightRuleLbs", {
    validate(v) {
        const MAX_LBS = 441.0; // ~200 kg
        if (typeof v === "string" && !v.trim())
            return true;
        if (!isNaN(parseFloat(v)) && v > 0 && v <= MAX_LBS)
            return true;
        if (!isNaN(parseFloat(v)) && v > MAX_LBS)
            return "It seems unlikely that the subject's weight exceeds 441 lbs. Please ensure that you are using the correct units. The weight should be specified in pounds (lbs)."
        if (!isNaN(parseFloat(v)) && v <= 0)
            return "The subject's weight must be greater than 0 lbs."
    }
})

export const rules = {
    weightRule: { weightRule: true },
    weightRuleLbs: { weightRuleLbs: true },
    heightRule: { heightRule: true },
    heightRuleFt: { heightRuleFt: true },
    birthYearRule: { birthYearRule: true },
    subjectTagsRule: { subjectTagsRule: true }
}
