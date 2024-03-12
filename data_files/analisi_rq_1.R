library(readxl)
library(dplyr)


column_types <- c("date", "text", "text","text", "text", "text", "numeric", "text", "numeric", "text", "text","text", "text")
column_names <- c("Timestamp_Risposta","Prolific_ID","Gender","Nationality","Role","Company_Size","Managing_Distributed_Teams_Familiarities","Years_of_experience_Managing","Evaluation_Team_Management","Team_Size","PMI_or_others_Certifications","CS_Familiarities", "CS_Experience")
survey_response <- read_excel("Selection Survey for Community Smells Recognition - Risposte.xlsx",col_types = column_types, col_names = column_names, skip=1)

# recupero tutti i differenti gender inseriti
unique_genders <- unique(survey_response[3])

# modifico le differenti modalità in cui sono stati scritti i gender per favorire l'analisi 

survey_response[3]<-survey_response[3] %>% mutate(Gender = if_else(Gender %in% c("male","man","M","Masculine","MALE","Man"),"Male", Gender))
survey_response[3]<-survey_response[3] %>% mutate(Gender = if_else(Gender %in% c("female","Woman","woman","Women","F"),"Female", Gender))
survey_response[3]<-survey_response[3] %>% mutate(Gender = if_else(Gender %in% c("Genderless","Non Binary"),"Others", Gender))



# Colcolo della distribuzione dei generi
gender_counts <- table(survey_response$Gender)

percentages <- prop.table(gender_counts) * 100

pie(gender_counts, labels = paste0(names(gender_counts), "\n  ", round(percentages, 1), "%"),
    main = "Distribution of Gender Values", col = rainbow(length(gender_counts))) # questi colori sono da rivedere
           


# Distribuzione delle nazionalità

nazionalita <- survey_response[4]
frequenze <- table(nazionalita)

soglia_percentuale <- 0.8 

other_nationalities <- names(frequenze[frequenze / sum(frequenze) * 100 < soglia_percentuale])

country_updated <- nazionalita %>% mutate ( Nationality = ifelse(Nationality %in% other_nationalities, "Others", Nationality))

counts_country <- sample(table(country_updated))
percentages_country <- prop.table(counts_country) * 100

colors <- rainbow(length(percentages_country))
par(bg=NA)

pie(counts_country, labels = paste0(names(counts_country), "  ",round(percentages_country, 1), "%"),
    main = "Nazione di provenienza del campione", col = rainbow(length(counts_country))) # questi colori sono da rivedere

dev.copy(png,'myplot.png')
dev.off()

#Esperienza nel management del campione

data <- table(survey_response$Evaluation_Team_Management)
limite_superiore <- max(data) +10
barplot(data, names.arg = c("Basic Experience", "Limited Experience", "Moderate Experience", "Significant Experience", "Considerable Experience"), col ="darkred", xlab = "Categorie", ylab = "Valori",ylim = c(0, limite_superiore))

 

# Familiarità con i CS                               
cs_familiarities <- survey_response[12]
cs_counts <- table(cs_familiarities)

percentages_cs <- prop.table(cs_counts) * 100
par(bg=NA)

pie(cs_counts, labels = paste0(names(cs_counts), "\n  ", round(percentages_cs, 1), "%"),
    main = "Familiarità con i Community smells",col = rainbow(length(cs_counts))) # questi colori sono da rivedere
dev.copy(png,'myplot1.png')
dev.off()
data <- table(survey_response$CS_Familiarities)
print(data)
limite_superiore <- max(data) +10
barplot(data, main = "Familiarità con i Community smells", names.arg = c("Maybe", "No", "Yes"), col ="darkred", ylab = "Numero di risposte",ylim = c(0, limite_superiore))


#Esperienza con i CS
cs_familiarities_experience <- survey_response[13] %>%  mutate(CS_Experience = if_else(CS_Experience %in% c("No","NA",NA,"-","All good","No experience","N/A","None","n/a","m/a","I do not have any experience of this term","I'm not familiar with that concept.","Not heard of this concept!","I don't think I am familiar with this term",",","I am not too familiar with it.","N/a","No experience.","I haven't heard the term before"),"No", CS_Experience))
cs_familiarities_experience <- unique(cs_familiarities_experience)
print(cs_familiarities_experience)


#Certificazioni ottenute

survey_response[11] <- survey_response[11] %>%  mutate(PMI_or_others_Certifications = if_else(!PMI_or_others_Certifications %in% c("No","Yes"),"Other Certifications", PMI_or_others_Certifications))
cert_counts <- table(survey_response[11])

percentages_cert <- prop.table(cert_counts) * 100

pie(cert_counts, labels = paste0(names(cert_counts), "\n  ", round(percentages_cert, 1), "%"),
    main = "Intervistati con certificazione PMI o similari", col = rainbow(length(cert_counts))) # questi colori sono da rivedere




#Filtro per le figure manageriali RQ_1.2

survey_response_managers <- survey_response %>% filter(Managing_Distributed_Teams_Familiarities %in% c("3","4","5"), Years_of_experience_Managing %in% c("3 - 5 years","5 - 10 years", "> 10 years"), Evaluation_Team_Management %in% c("4","5"), PMI_or_others_Certifications %in% c("Yes","Other Certifications"))



# Distribuzione dei generi
gender_counts <- table(survey_response_managers$Gender)

percentages <- prop.table(gender_counts) * 100

par(bg=NA)
pie(gender_counts, labels = paste0(names(gender_counts), "\n  ", round(percentages, 1), "%"),
    main = "Distribution of Gender Values", col = rainbow(length(gender_counts))) # questi colori sono da rivedere
dev.copy(png,'myplot2.png')
dev.off()


# Familiarità con i CS                               
cs_familiarities <- survey_response_managers[12]
cs_counts <- table(cs_familiarities)

percentages_cs <- prop.table(cs_counts) * 100

par(bg=NA)
pie(cs_counts, labels = paste0(names(cs_counts), "\n  ", round(percentages_cs, 1), "%"),
    main = "Familiarità dei manager con i Community Smells", col = rainbow(length(cs_counts))) # questi colori sono da rivedere
dev.copy(png,'myplot3.png')
dev.off()


#Esperienza con i CS
cs_familiarities_experience <- survey_response_managers[13] %>%  mutate(CS_Experience = if_else(CS_Experience %in% c("No","NA",NA,"-","All good","No experience","N/A","None","n/a","m/a","I do not have any experience of this term","I'm not familiar with that concept.","Not heard of this concept!","I don't think I am familiar with this term",",","I am not too familiar with it.","N/a","No experience.","I haven't heard the term before"),"No", CS_Experience))
cs_familiarities_experience <- unique(cs_familiarities_experience)

print(cs_familiarities_experience)


# Distribuzione delle nazionalità

nazionalita <- survey_response_managers[4]
frequenze <- table(nazionalita)

soglia_percentuale <- 1 

other_nationalities <- names(frequenze[frequenze / sum(frequenze) * 100 < soglia_percentuale])

country_updated <- nazionalita %>% mutate ( Nationality = ifelse(Nationality %in% other_nationalities, "Others", Nationality))

counts_country <- table(country_updated)
percentages_country <- prop.table(counts_country) * 100

colors <- rainbow(length(percentages_country))
par(bg=NA)

pie(counts_country, labels = paste0(names(counts_country), "  ",round(percentages_country, 1), "%"),
    ,main = "Nazionalità delle figure manageriali", col = rainbow(length(counts_country))) # questi colori sono da rivedere
dev.copy(svg,'myplot5.svg')
dev.off()
#Prolific ID Managers

prolificID <- survey_response_managers[2]





