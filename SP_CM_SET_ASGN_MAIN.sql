ALTER   PROCEDURE [Census].[SP_CM_SET_ASGN_MAIN]
(
    @pBaseJson        nvarchar(max),
    @pJson            nvarchar(max),
    @pResultJson      nvarchar(max) OUTPUT,
    @pErrCode         int = 0 OUTPUT,
    @pErrMsg          nvarchar(200) OUTPUT
)
AS
BEGIN
    SET NOCOUNT ON
    SET XACT_ABORT ON
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	CREATE TABLE #sResultTable_SetCM_ASGN_MAIN(
        ASGN_UID bigint
    )

    DECLARE
        @sBeginTranCount int = 0,
        @sNow            datetime2 = DATEADD(HOUR, 8, SYSUTCDATETIME()),
		@sTableName      varchar(50) = 'CM_ASGN_MAIN',
        @sIsReturnResult char(1),
        @sTestMode	     int = 0, -- 0: Normal(Non-Test), 1: UnitTest, 2: Scenario Test
        @sNonceToken     varchar(64),
		@sUserID		 varchar(20),
		@sStaffPositionUID	int,
		@sAuthByLst      nvarchar(max),
		@sAuthByGUID     uniqueidentifier,
		@sSystemCode    varchar(5)

    SET @sBeginTranCount = @@TRANCOUNT
    SELECT @pErrCode = 0 , @pErrMsg = ''

    SELECT *
    INTO #BaseJsonDataTable
    FROM Census.FN_GetBaseJson(@pBaseJson)

    SELECT *
    INTO #sDataSet_SetCM_ASGN_MAIN
    FROM OPENJSON(@pJson)
    WITH (
        [ASGN_UID] bigint '$.ASGN_UID', 
		[GUID] uniqueidentifier '$.GUID', 
		[ASGN_SEQ] int '$.ASGN_SEQ',
		[QTR_UID] bigint '$.QTR_UID', 
		[HH_NO] int '$.HH_NO', 
		[ESTB_UID] bigint '$.ESTB_UID', 
		[PSU_NO] numeric(3, 0) '$.PSU_NO', 
		[OS] varchar(2) '$.OS', 
		[SC_UID] int '$.SC_UID', 
		[MAIN_ASGN_UID] bigint '$.MAIN_ASGN_UID', 
		[SRC_ASGN_UID] bigint '$.SRC_ASGN_UID', 
		[PREV_ASGN_UID] bigint '$.PREV_ASGN_UID', 
		[ASGN_PRTY] tinyint '$.ASGN_PRTY', 
		[FRM_TYP] varchar(10) '$.FRM_TYP', 
		[CASE_TYP] varchar(10) '$.CASE_TYP', 
		[ASGN_SRC] varchar(5) '$.ASGN_SRC', 
		[NEW_ASGN_TYP] varchar(3) '$.NEW_ASGN_TYP', 
		[ASGN_STG_IND] varchar(2) '$.ASGN_STG_IND', 
		[ASGN_STS] varchar(5) '$.ASGN_STS', 
		[ENUM_RSLT_CD] varchar(4) '$.ENUM_RSLT_CD', 
		[ENUM_RSLT_RMKS] nvarchar(500) '$.ENUM_RSLT_RMKS', 
		[VST_RSLT_CD] varchar(4) '$.VST_RSLT_CD', 
		[VST_RSLT_RMKS] nvarchar(500) '$.VST_RSLT_RMKS', 
		[VST_DT] datetime '$.VST_DT', 
		[SP_IND] varchar(1) '$.SP_IND', 
		[NFA_IND] varchar(1) '$.NFA_IND', 
		[OCP_IND] varchar(1) '$.OCP_IND', 
		[UE_IND] varchar(1) '$.UE_IND', 
		[NC_IND] varchar(1) '$.NC_IND', 
		[RFSL_IND] varchar(1) '$.RFSL_IND', 
		[RFSL_LVL] tinyint '$.RFSL_LVL', 
		[NFV_IND] varchar(1) '$.NFV_IND', 
		[NFW_RSN] varchar(1) '$.NFW_RSN', 
		[NR_RMKS] nvarchar(500) '$.NR_RMKS', 
		[NRC_IND] varchar(1) '$.NRC_IND', 
		[DC_RTN_MDE] varchar(1) '$.DC_RTN_MDE', 
		[DC_CMPL_BY_STF_POSN_UID] int '$.DC_CMPL_BY_STF_POSN_UID', 
		[DC_CMPL_DT] datetime '$.DC_CMPL_DT', 
		[DC_SUBM_DT] datetime '$.DC_SUBM_DT', 
		[CET_SUBM_DT] datetime '$.CET_SUBM_DT', 
		[FU_QC_IND] varchar(4) '$.FU_QC_IND', 
		[FU_QC_RTN_MDE] varchar(1) '$.FU_QC_RTN_MDE', 
		[FU_QC_CRE_DT] datetime '$.FU_QC_CRE_DT', 
		[FU_QC_CMPL_BY_STF_POSN_UID] int '$.FU_QC_CMPL_BY_STF_POSN_UID', 
		[FU_QC_CMPL_DT] datetime '$.FU_QC_CMPL_DT', 
		[ASGN_TO_POSN_UID] int '$.ASGN_TO_POSN_UID', 
		[NCN_FC_SUM] int '$.NCN_FC_SUM', 
		[NCD_FC_SUM] int '$.NCD_FC_SUM', 
		[NCN_CSC_SUM] int '$.NCN_CSC_SUM', 
		[NCD_CSC_SUM] int '$.NCD_CSC_SUM', 
		[SMS_IND] varchar(1) '$.SMS_IND', 
		[MAIL_ADDR_CHI_1] nvarchar(55) '$.MAIL_ADDR_CHI_1', 
		[MAIL_ADDR_CHI_2] nvarchar(55) '$.MAIL_ADDR_CHI_2', 
		[MAIL_ADDR_CHI_3] nvarchar(55) '$.MAIL_ADDR_CHI_3', 
		[MAIL_ADDR_CHI_4] nvarchar(55) '$.MAIL_ADDR_CHI_4', 
		[MAIL_ADDR_CHI_5] nvarchar(55) '$.MAIL_ADDR_CHI_5', 
		[MAIL_ADDR_ENG_1] nvarchar(55) '$.MAIL_ADDR_ENG_1', 
		[MAIL_ADDR_ENG_2] nvarchar(55) '$.MAIL_ADDR_ENG_2', 
		[MAIL_ADDR_ENG_3] nvarchar(55) '$.MAIL_ADDR_ENG_3', 
		[MAIL_ADDR_ENG_4] nvarchar(55) '$.MAIL_ADDR_ENG_4', 
		[MAIL_ADDR_ENG_5] nvarchar(55) '$.MAIL_ADDR_ENG_5', 
		[OQ_ACCT_IND] varchar(1) '$.OQ_ACCT_IND', 
		[GRP_NO] varchar(40) '$.GRP_NO', 
		[GRP_NAME] nvarchar(50) '$.GRP_NAME', 
		[CRE_DT] datetime '$.CRE_DT', 
		[CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', 
		[CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', 
		[UPD_DT] datetime '$.UPD_DT', 
		[UPD_BY_USR_ID] varchar(20) '$.UPD_BY_USR_ID', 
		[UPD_BY_STF_POSN_UID] int '$.UPD_BY_STF_POSN_UID', 
		[DEL_IND] varchar(1) '$.DEL_IND', 
		[DEL_DT] datetime '$.DEL_DT', 
		[DEL_BY_USR_ID] varchar(20) '$.DEL_BY_USR_ID', 
		[DEL_BY_STF_POSN_UID] int '$.DEL_BY_STF_POSN_UID', 
		[VER_NO] int '$.VER_NO', 
		[ASGN_REF_NO] varchar(50) '$.ASGN_REF_NO', 
		[MAIL_ADDR_ENG_6] nvarchar(55) '$.MAIL_ADDR_ENG_6', 
		[MAIL_ADDR_TPU] varchar(3) '$.MAIL_ADDR_TPU', 
		[MAIL_ADDR_SB] varchar(2) '$.MAIL_ADDR_SB', 
		[MAIL_ADDR_PLOT] varchar(2) '$.MAIL_ADDR_PLOT', 
		[RPLT_NO] varchar(20) '$.RPLT_NO', 
		[WL] numeric(11, 4) '$.WL', 
		[INIT_MDE] varchar(1) '$.INIT_MDE', 
		[PREV_ASGN_STS] varchar(5) '$.PREV_ASGN_STS', 
		[EOE_RSN_CD] varchar(4) '$.EOE_RSN_CD', 
		[CERTY_IND] varchar(1) '$.CERTY_IND', 
		[PRMNT_IND] varchar(1) '$.PRMNT_IND', 
		[EOE_RSN_RMK] nvarchar(500) '$.EOE_RSN_RMK', 
		[NFUQC_IND] varchar(1) '$.NFUQC_IND', 
		[GHS_CASE_IND] varchar(1) '$.GHS_CASE_IND', 
		[INFL_IND] varchar(1) '$.INFL_IND', 
		[ATND_IND] varchar(1) '$.ATND_IND', 
		[MULT_SRVY_IND] varchar(1) '$.MULT_SRVY_IND', 
		[QC_SAMP_IND] varchar(1) '$.QC_SAMP_IND',
		[NE_IND] varchar(1) '$.NE_IND',
		[MIST_TYP] varchar(1) '$.MIST_TYP',
		[MIST_RMKS] nvarchar(500) '$.MIST_RMKS',
		[FU_QC_CNT] TINYINT '$.FU_QC_CNT',
		[ENUM_RSLT_CD_RAW] VARCHAR(4) '$.ENUM_RSLT_CD_RAW',
		[MAIL_ADDR_BLDG_SERL] NUMERIC(6, 0) '$.MAIL_ADDR_BLDG_SERL',
		[MAIL_ADDR_LAT] NUMERIC(18, 8) '$.MAIL_ADDR_LAT',
		[MAIL_ADDR_LONG] NUMERIC(18, 8) '$.MAIL_ADDR_LONG',
		[MAIL_ADDR_CHI] NVARCHAR(60) '$.MAIL_ADDR_CHI',
		[FW_ADDR_ENG_1] NVARCHAR(30) '$.FW_ADDR_ENG_1',
		[FW_ADDR_ENG_2] NVARCHAR(30) '$.FW_ADDR_ENG_2',
		[FW_ADDR_ENG_3] NVARCHAR(30) '$.FW_ADDR_ENG_3',
		[FW_ADDR_ENG_4] NVARCHAR(30) '$.FW_ADDR_ENG_4',
		[FW_ADDR_TPU] VARCHAR(3) '$.FW_ADDR_TPU',
		[FW_ADDR_SB] VARCHAR(2) '$.FW_ADDR_SB',
		[FW_ADDR_PLOT] VARCHAR(2) '$.FW_ADDR_PLOT',
		[FW_ADDR_BLDG_SERL] NUMERIC(6, 0) '$.FW_ADDR_BLDG_SERL',
		[FW_ADDR_LAT] NUMERIC(18, 8) '$.FW_ADDR_LAT',
		[FW_ADDR_LONG] NUMERIC(18, 8) '$.FW_ADDR_LONG',
		[FW_ADDR_CHI] NVARCHAR(60) '$.FW_ADDR_CHI',
		[WRG_ADDR_IND] varchar(1) '$.WRG_ADDR_IND',
		[REACT_EXP_DATE] datetime '$.REACT_EXP_DATE',
		[BYPA_IND] varchar(1) '$.BYPA_IND',
		[CONF_MO_HH_IND] varchar(1) '$.CONF_MO_HH_IND',
		[REQ_HH_LTR_IND] varchar(1) '$.REQ_HH_LTR_IND',
		[SKP_RMDR_IND] varchar(1) '$.SKP_RMDR_IND',
		[PREV_EOE_RSN_CD] varchar(4) '$.PREV_EOE_RSN_CD',
		[COND_SRCH_IND] varchar(1) '$.COND_SRCH_IND',
		[HC_IND] varchar(1) '$.HC_IND',
		[OQ_EXP_DATE] datetime '$.OQ_EXP_DATE',
		RecordState varchar(1)
    )

    BEGIN TRY
        IF @sBeginTranCount = 0 BEGIN
            BEGIN TRAN
        END
		
        IF EXISTS(SELECT 1 FROM #BaseJsonDataTable b) BEGIN
            SELECT TOP 1 
				@sIsReturnResult = ISNULL(b.IsReturnResult, 'N'), 
				@sTestMode = ISNULL(b.TestMode, 0), 
				@sUserID = b.UserID, 
				@sStaffPositionUID = b.StaffPositionUID,
				@sSystemCode = b.SystemCode
			FROM #BaseJsonDataTable b
        END

        IF EXISTS (SELECT 1 FROM #sDataSet_SetCM_ASGN_MAIN WHERE RecordState = 'I') BEGIN
            INSERT INTO [Census].[CM_ASGN_MAIN](
				[GUID], 
				[ASGN_SEQ],
				[QTR_UID], 
				[HH_NO], 
				[ESTB_UID], 
				[PSU_NO], 
				[OS], 
				[SC_UID], 
				[MAIN_ASGN_UID], 
				[SRC_ASGN_UID], 
				[PREV_ASGN_UID], 
				[ASGN_PRTY], 
				[FRM_TYP], 
				[CASE_TYP], 
				[ASGN_SRC], 
				[NEW_ASGN_TYP], 
				[ASGN_STG_IND], 
				[ASGN_STS], 
				[ENUM_RSLT_CD], 
				[ENUM_RSLT_RMKS], 
				[VST_RSLT_CD], 
				[VST_RSLT_RMKS], 
				[VST_DT], 
				[SP_IND], 
				[NFA_IND], 
				[OCP_IND], 
				[UE_IND], 
				[NC_IND], 
				[RFSL_IND], 
				[RFSL_LVL], 
				[NFV_IND], 
				[NFW_RSN], 
				[NR_RMKS], 
				[NRC_IND], 
				[DC_RTN_MDE], 
				[DC_CMPL_BY_STF_POSN_UID], 
				[DC_CMPL_DT], 
				[FU_QC_IND], 
				[FU_QC_RTN_MDE], 
				[FU_QC_CRE_DT], 
				[FU_QC_CMPL_BY_STF_POSN_UID], 
				[FU_QC_CMPL_DT], 
				[ASGN_TO_POSN_UID], 
				[NCN_FC_SUM], 
				[NCD_FC_SUM], 
				[NCN_CSC_SUM], 
				[NCD_CSC_SUM], 
				[SMS_IND], 
				[MAIL_ADDR_CHI_1], 
				[MAIL_ADDR_CHI_2], 
				[MAIL_ADDR_CHI_3], 
				[MAIL_ADDR_CHI_4], 
				[MAIL_ADDR_CHI_5], 
				[MAIL_ADDR_ENG_1], 
				[MAIL_ADDR_ENG_2], 
				[MAIL_ADDR_ENG_3], 
				[MAIL_ADDR_ENG_4], 
				[MAIL_ADDR_ENG_5], 
				[OQ_ACCT_IND], 
				[GRP_NO], 
				[GRP_NAME], 
				[CRE_DT], 
				[CRE_BY_USR_ID], 
				[CRE_BY_STF_POSN_UID], 
				[UPD_DT], 
				[UPD_BY_USR_ID], 
				[UPD_BY_STF_POSN_UID], 
				[DEL_IND], 
				[DEL_DT], 
				[DEL_BY_USR_ID], 
				[DEL_BY_STF_POSN_UID], 
				[VER_NO], 
				[ASGN_REF_NO], 
				[MAIL_ADDR_ENG_6], 
				[MAIL_ADDR_TPU], 
				[MAIL_ADDR_SB], 
				[MAIL_ADDR_PLOT], 
				[RPLT_NO], 
				[WL], 
				[INIT_MDE], 
				[PREV_ASGN_STS], 
				[EOE_RSN_CD], 
				[CERTY_IND], 
				[PRMNT_IND], 
				[EOE_RSN_RMK], 
				[NFUQC_IND], 
				[GHS_CASE_IND], 
				[INFL_IND], 
				[ATND_IND], 
				[MULT_SRVY_IND], 
				[QC_SAMP_IND],
				[NE_IND],
				[MIST_TYP],
				[MIST_RMKS],
				[FU_QC_CNT],
				[ENUM_RSLT_CD_RAW],
		        [MAIL_ADDR_BLDG_SERL],
		        [MAIL_ADDR_LAT],
		        [MAIL_ADDR_LONG],
		        [MAIL_ADDR_CHI],
		        [FW_ADDR_ENG_1],
		        [FW_ADDR_ENG_2],
		        [FW_ADDR_ENG_3],
		        [FW_ADDR_ENG_4],
		        [FW_ADDR_TPU],
		        [FW_ADDR_SB],
		        [FW_ADDR_PLOT],
		        [FW_ADDR_BLDG_SERL],
		        [FW_ADDR_LAT],
		        [FW_ADDR_LONG],
		        [FW_ADDR_CHI],
                [WRG_ADDR_IND],
                [REACT_EXP_DATE],
				[BYPA_IND],
                [CONF_MO_HH_IND],
                [REQ_HH_LTR_IND],
                [SKP_RMDR_IND],
				[PREV_EOE_RSN_CD],
				[COND_SRCH_IND],
				[HC_IND],
				[OQ_EXP_DATE]
			)
			OUTPUT INSERTED.ASGN_UID
			INTO #sResultTable_SetCM_ASGN_MAIN
            SELECT 
				ISNULL(tmp.[GUID], newID()), 
				tmp.[ASGN_SEQ],
				tmp.[QTR_UID], 
				tmp.[HH_NO], 
				tmp.[ESTB_UID], 
				tmp.[PSU_NO], 
				tmp.[OS], 
				tmp.[SC_UID], 
				tmp.[MAIN_ASGN_UID], 
				tmp.[SRC_ASGN_UID], 
				tmp.[PREV_ASGN_UID], 
				tmp.[ASGN_PRTY], 
				tmp.[FRM_TYP], 
				tmp.[CASE_TYP], 
				tmp.[ASGN_SRC], 
				tmp.[NEW_ASGN_TYP], 
				ISNULL(tmp.[ASGN_STG_IND], 'D'), 
				tmp.[ASGN_STS], 
				tmp.[ENUM_RSLT_CD], 
				tmp.[ENUM_RSLT_RMKS], 
				tmp.[VST_RSLT_CD], 
				tmp.[VST_RSLT_RMKS], 
				tmp.[VST_DT], 
				tmp.[SP_IND], 
				tmp.[NFA_IND], 
				tmp.[OCP_IND], 
				tmp.[UE_IND], 
				tmp.[NC_IND], 
				tmp.[RFSL_IND], 
				tmp.[RFSL_LVL], 
				tmp.[NFV_IND], 
				tmp.[NFW_RSN],
				tmp.[NR_RMKS], 
				tmp.[NRC_IND], 
				tmp.[DC_RTN_MDE], 
				tmp.[DC_CMPL_BY_STF_POSN_UID], 
				tmp.[DC_CMPL_DT], 
				tmp.[FU_QC_IND], 
				tmp.[FU_QC_RTN_MDE], 
				tmp.[FU_QC_CRE_DT], 
				tmp.[FU_QC_CMPL_BY_STF_POSN_UID], 
				tmp.[FU_QC_CMPL_DT], 
				tmp.[ASGN_TO_POSN_UID], 
				tmp.[NCN_FC_SUM], 
				tmp.[NCD_FC_SUM], 
				tmp.[NCN_CSC_SUM], 
				tmp.[NCD_CSC_SUM], 
				tmp.[SMS_IND], 
				tmp.[MAIL_ADDR_CHI_1], 
				tmp.[MAIL_ADDR_CHI_2], 
				tmp.[MAIL_ADDR_CHI_3], 
				tmp.[MAIL_ADDR_CHI_4], 
				tmp.[MAIL_ADDR_CHI_5], 
				tmp.[MAIL_ADDR_ENG_1], 
				tmp.[MAIL_ADDR_ENG_2], 
				tmp.[MAIL_ADDR_ENG_3], 
				tmp.[MAIL_ADDR_ENG_4], 
				tmp.[MAIL_ADDR_ENG_5], 
				ISNULL(tmp.[OQ_ACCT_IND], 'N'), 
				tmp.[GRP_NO], 
				tmp.[GRP_NAME], 
				@sNow, 
				@sUserID, 
				@sStaffPositionUID, 
				@sNow, 
				@sUserID, 
				@sStaffPositionUID, 
				ISNULL(tmp.[DEL_IND],'N'), 
				tmp.[DEL_DT], 
				tmp.[DEL_BY_USR_ID], 
				tmp.[DEL_BY_STF_POSN_UID], 
				1, 
				tmp.[ASGN_REF_NO], 
				tmp.[MAIL_ADDR_ENG_6], 
				tmp.[MAIL_ADDR_TPU], 
				tmp.[MAIL_ADDR_SB], 
				tmp.[MAIL_ADDR_PLOT], 
				tmp.[RPLT_NO], 
				tmp.[WL], 
				tmp.[INIT_MDE], 
				tmp.[PREV_ASGN_STS], 
				tmp.[EOE_RSN_CD], 
				tmp.[CERTY_IND], 
				tmp.[PRMNT_IND], 
				tmp.[EOE_RSN_RMK], 
				tmp.[NFUQC_IND], 
				tmp.[GHS_CASE_IND], 
				tmp.[INFL_IND], 
				tmp.[ATND_IND], 
				tmp.[MULT_SRVY_IND], 
				tmp.[QC_SAMP_IND],
				ISNULL(tmp.[NE_IND],'N'),
				tmp.[MIST_TYP],
				tmp.[MIST_RMKS],
				ISNULL(tmp.[FU_QC_CNT], 0),
				tmp.[ENUM_RSLT_CD_RAW],
		        tmp.[MAIL_ADDR_BLDG_SERL],
		        tmp.[MAIL_ADDR_LAT],
		        tmp.[MAIL_ADDR_LONG],
		        tmp.[MAIL_ADDR_CHI],
		        tmp.[FW_ADDR_ENG_1],
		        tmp.[FW_ADDR_ENG_2],
		        tmp.[FW_ADDR_ENG_3],
		        tmp.[FW_ADDR_ENG_4],
		        tmp.[FW_ADDR_TPU],
		        tmp.[FW_ADDR_SB],
		        tmp.[FW_ADDR_PLOT],
		        tmp.[FW_ADDR_BLDG_SERL],
		        tmp.[FW_ADDR_LAT],
		        tmp.[FW_ADDR_LONG],
		        tmp.[FW_ADDR_CHI],
	    		ISNULL(tmp.[WRG_ADDR_IND],'N'),
                tmp.[REACT_EXP_DATE],
                tmp.[BYPA_IND],
                ISNULL(tmp.[CONF_MO_HH_IND],'N'),
                ISNULL(tmp.[REQ_HH_LTR_IND],'N'),
                ISNULL(tmp.[SKP_RMDR_IND],'N'),
				tmp.[PREV_EOE_RSN_CD],
				tmp.[COND_SRCH_IND],
				ISNULL(tmp.[HC_IND],'N'),
				tmp.[OQ_EXP_DATE]
			FROM #sDataSet_SetCM_ASGN_MAIN tmp
			WHERE RecordState = 'I' 
		
        END

        IF EXISTS (SELECT 1 FROM #sDataSet_SetCM_ASGN_MAIN WHERE RecordState = 'U') BEGIN
            UPDATE cmasgnmain SET 
				 [GUID] = ISNULL(tmp.[GUID], cmasgnmain.[GUID]), 
				 [ASGN_SEQ] = ISNULL(tmp.[ASGN_SEQ], cmasgnmain.[ASGN_SEQ]), 
				 [QTR_UID] = ISNULL(tmp.[QTR_UID], cmasgnmain.[QTR_UID]), 
				 [HH_NO] = ISNULL(tmp.[HH_NO], cmasgnmain.[HH_NO]), 
				 [ESTB_UID] = ISNULL(tmp.[ESTB_UID], cmasgnmain.[ESTB_UID]), 
				 [PSU_NO] = ISNULL(tmp.[PSU_NO], cmasgnmain.[PSU_NO]), 
				 [OS] = ISNULL(tmp.[OS], cmasgnmain.[OS]), 
				 [SC_UID] = ISNULL(tmp.[SC_UID], cmasgnmain.[SC_UID]), 
				 [MAIN_ASGN_UID] = ISNULL(tmp.[MAIN_ASGN_UID], cmasgnmain.[MAIN_ASGN_UID]), 
				 [SRC_ASGN_UID] = ISNULL(tmp.[SRC_ASGN_UID], cmasgnmain.[SRC_ASGN_UID]), 
				 [PREV_ASGN_UID] = ISNULL(tmp.[PREV_ASGN_UID], cmasgnmain.[PREV_ASGN_UID]), 
				 [ASGN_PRTY] = ISNULL(tmp.[ASGN_PRTY], cmasgnmain.[ASGN_PRTY]), 
				 [FRM_TYP] = ISNULL(tmp.[FRM_TYP], cmasgnmain.[FRM_TYP]), 
				 [CASE_TYP] = ISNULL(tmp.[CASE_TYP], cmasgnmain.[CASE_TYP]), 
				 [ASGN_SRC] = ISNULL(tmp.[ASGN_SRC], cmasgnmain.[ASGN_SRC]), 
				 [NEW_ASGN_TYP] = ISNULL(tmp.[NEW_ASGN_TYP], cmasgnmain.[NEW_ASGN_TYP]), 
				 [ASGN_STG_IND] = ISNULL(tmp.[ASGN_STG_IND], cmasgnmain.[ASGN_STG_IND]), 
				 [ASGN_STS] = ISNULL(tmp.[ASGN_STS], cmasgnmain.[ASGN_STS]), 
				 [ENUM_RSLT_CD] = ISNULL(tmp.[ENUM_RSLT_CD], cmasgnmain.[ENUM_RSLT_CD]), 
				 [ENUM_RSLT_RMKS] = ISNULL(tmp.[ENUM_RSLT_RMKS], cmasgnmain.[ENUM_RSLT_RMKS]), 
				 [VST_RSLT_CD] = ISNULL(tmp.[VST_RSLT_CD], cmasgnmain.[VST_RSLT_CD]), 
				 [VST_RSLT_RMKS] = ISNULL(tmp.[VST_RSLT_RMKS], cmasgnmain.[VST_RSLT_RMKS]), 
				 [VST_DT] = ISNULL(tmp.[VST_DT], cmasgnmain.[VST_DT]), 
				 [SP_IND] = ISNULL(tmp.[SP_IND], cmasgnmain.[SP_IND]), 
				 [NFA_IND] = ISNULL(tmp.[NFA_IND], cmasgnmain.[NFA_IND]), 
				 [OCP_IND] = ISNULL(tmp.[OCP_IND], cmasgnmain.[OCP_IND]), 
				 [UE_IND] = ISNULL(tmp.[UE_IND], cmasgnmain.[UE_IND]), 
				 [NC_IND] = ISNULL(tmp.[NC_IND], cmasgnmain.[NC_IND]), 
				 [RFSL_IND] = ISNULL(tmp.[RFSL_IND], cmasgnmain.[RFSL_IND]), 
				 [RFSL_LVL] = ISNULL(tmp.[RFSL_LVL], cmasgnmain.[RFSL_LVL]), 
				 [NFV_IND] = ISNULL(tmp.[NFV_IND], cmasgnmain.[NFV_IND]), 
				 [NFW_RSN] = ISNULL(tmp.[NFW_RSN], cmasgnmain.[NFW_RSN]), 
				 [NR_RMKS] = ISNULL(tmp.[NR_RMKS], cmasgnmain.[NR_RMKS]), 
				 [NRC_IND] = ISNULL(tmp.[NRC_IND], cmasgnmain.[NRC_IND]), 
				 [DC_RTN_MDE] = ISNULL(tmp.[DC_RTN_MDE], cmasgnmain.[DC_RTN_MDE]), 
				 [DC_CMPL_BY_STF_POSN_UID] = ISNULL(tmp.[DC_CMPL_BY_STF_POSN_UID], cmasgnmain.[DC_CMPL_BY_STF_POSN_UID]), 
				 [DC_CMPL_DT] = ISNULL(tmp.[DC_CMPL_DT], cmasgnmain.[DC_CMPL_DT]),
				 [DC_SUBM_DT] = ISNULL(tmp.[DC_SUBM_DT], cmasgnmain.[DC_SUBM_DT]), 
				 [CET_SUBM_DT] = ISNULL(tmp.[CET_SUBM_DT], cmasgnmain.[CET_SUBM_DT]), 
				 [FU_QC_IND] = ISNULL(tmp.[FU_QC_IND], cmasgnmain.[FU_QC_IND]), 
				 [FU_QC_RTN_MDE] = ISNULL(tmp.[FU_QC_RTN_MDE], cmasgnmain.[FU_QC_RTN_MDE]), 
				 [FU_QC_CRE_DT] = ISNULL(tmp.[FU_QC_CRE_DT], cmasgnmain.[FU_QC_CRE_DT]), 
				 [FU_QC_CMPL_BY_STF_POSN_UID] = ISNULL(tmp.[FU_QC_CMPL_BY_STF_POSN_UID], cmasgnmain.[FU_QC_CMPL_BY_STF_POSN_UID]), 
				 [FU_QC_CMPL_DT] = ISNULL(tmp.[FU_QC_CMPL_DT], cmasgnmain.[FU_QC_CMPL_DT]), 
				 [ASGN_TO_POSN_UID] = ISNULL(tmp.[ASGN_TO_POSN_UID], cmasgnmain.[ASGN_TO_POSN_UID]), 
				 [NCN_FC_SUM] = ISNULL(tmp.[NCN_FC_SUM], cmasgnmain.[NCN_FC_SUM]), 
				 [NCD_FC_SUM] = ISNULL(tmp.[NCD_FC_SUM], cmasgnmain.[NCD_FC_SUM]), 
				 [NCN_CSC_SUM] = ISNULL(tmp.[NCN_CSC_SUM], cmasgnmain.[NCN_CSC_SUM]), 
				 [NCD_CSC_SUM] = ISNULL(tmp.[NCD_CSC_SUM], cmasgnmain.[NCD_CSC_SUM]), 
				 [SMS_IND] = ISNULL(tmp.[SMS_IND], cmasgnmain.[SMS_IND]), 
				 [MAIL_ADDR_CHI_1] = ISNULL(tmp.[MAIL_ADDR_CHI_1], cmasgnmain.[MAIL_ADDR_CHI_1]), 
				 [MAIL_ADDR_CHI_2] = ISNULL(tmp.[MAIL_ADDR_CHI_2], cmasgnmain.[MAIL_ADDR_CHI_2]), 
				 [MAIL_ADDR_CHI_3] = ISNULL(tmp.[MAIL_ADDR_CHI_3], cmasgnmain.[MAIL_ADDR_CHI_3]), 
				 [MAIL_ADDR_CHI_4] = ISNULL(tmp.[MAIL_ADDR_CHI_4], cmasgnmain.[MAIL_ADDR_CHI_4]), 
				 [MAIL_ADDR_CHI_5] = ISNULL(tmp.[MAIL_ADDR_CHI_5], cmasgnmain.[MAIL_ADDR_CHI_5]), 
				 [MAIL_ADDR_ENG_1] = ISNULL(tmp.[MAIL_ADDR_ENG_1], cmasgnmain.[MAIL_ADDR_ENG_1]), 
				 [MAIL_ADDR_ENG_2] = ISNULL(tmp.[MAIL_ADDR_ENG_2], cmasgnmain.[MAIL_ADDR_ENG_2]), 
				 [MAIL_ADDR_ENG_3] = ISNULL(tmp.[MAIL_ADDR_ENG_3], cmasgnmain.[MAIL_ADDR_ENG_3]), 
				 [MAIL_ADDR_ENG_4] = ISNULL(tmp.[MAIL_ADDR_ENG_4], cmasgnmain.[MAIL_ADDR_ENG_4]), 
				 [MAIL_ADDR_ENG_5] = ISNULL(tmp.[MAIL_ADDR_ENG_5], cmasgnmain.[MAIL_ADDR_ENG_5]), 
				 [OQ_ACCT_IND] = ISNULL(tmp.[OQ_ACCT_IND], cmasgnmain.[OQ_ACCT_IND]), 
				 [GRP_NO] = ISNULL(tmp.[GRP_NO], cmasgnmain.[GRP_NO]), 
				 [GRP_NAME] = ISNULL(tmp.[GRP_NAME], cmasgnmain.[GRP_NAME]), 
				 [UPD_DT] = @sNow, 
				 [UPD_BY_USR_ID] = @sUserID, 
				 [UPD_BY_STF_POSN_UID] = @sStaffPositionUID, 
				 [DEL_IND] = ISNULL(tmp.[DEL_IND], cmasgnmain.[DEL_IND]), 
				 [VER_NO] = cmasgnmain.[VER_NO] + 1, 
				 [ASGN_REF_NO] = ISNULL(tmp.[ASGN_REF_NO], cmasgnmain.[ASGN_REF_NO]), 
				 [MAIL_ADDR_ENG_6] = ISNULL(tmp.[MAIL_ADDR_ENG_6], cmasgnmain.[MAIL_ADDR_ENG_6]), 
				 [MAIL_ADDR_TPU] = ISNULL(tmp.[MAIL_ADDR_TPU], cmasgnmain.[MAIL_ADDR_TPU]), 
				 [MAIL_ADDR_SB] = ISNULL(tmp.[MAIL_ADDR_SB], cmasgnmain.[MAIL_ADDR_SB]), 
				 [MAIL_ADDR_PLOT] = ISNULL(tmp.[MAIL_ADDR_PLOT], cmasgnmain.[MAIL_ADDR_PLOT]), 
				 [RPLT_NO] = ISNULL(tmp.[RPLT_NO], cmasgnmain.[RPLT_NO]), 
				 [WL] = ISNULL(tmp.[WL], cmasgnmain.[WL]), 
				 [INIT_MDE] = ISNULL(tmp.[INIT_MDE], cmasgnmain.[INIT_MDE]), 
				 [PREV_ASGN_STS] = ISNULL(tmp.[PREV_ASGN_STS], cmasgnmain.[PREV_ASGN_STS]), 
				 [EOE_RSN_CD] = ISNULL(tmp.[EOE_RSN_CD], cmasgnmain.[EOE_RSN_CD]), 
				 [CERTY_IND] = ISNULL(tmp.[CERTY_IND], cmasgnmain.[CERTY_IND]), 
				 [PRMNT_IND] = ISNULL(tmp.[PRMNT_IND], cmasgnmain.[PRMNT_IND]), 
				 [EOE_RSN_RMK] = ISNULL(tmp.[EOE_RSN_RMK], cmasgnmain.[EOE_RSN_RMK]), 
				 [NFUQC_IND] = ISNULL(tmp.[NFUQC_IND], cmasgnmain.[NFUQC_IND]), 
				 [GHS_CASE_IND] = ISNULL(tmp.[GHS_CASE_IND], cmasgnmain.[GHS_CASE_IND]), 
				 [INFL_IND] = ISNULL(tmp.[INFL_IND], cmasgnmain.[INFL_IND]), 
				 [ATND_IND] = ISNULL(tmp.[ATND_IND], cmasgnmain.[ATND_IND]), 
				 [MULT_SRVY_IND] = ISNULL(tmp.[MULT_SRVY_IND], cmasgnmain.[MULT_SRVY_IND]), 
				 [QC_SAMP_IND] = ISNULL(tmp.[QC_SAMP_IND], cmasgnmain.[QC_SAMP_IND]),
				 [NE_IND] = ISNULL(tmp.[NE_IND], cmasgnmain.[NE_IND]),
				 [MIST_TYP] = ISNULL(tmp.[MIST_TYP], cmasgnmain.[MIST_TYP]),
				 [MIST_RMKS] = ISNULL(tmp.[MIST_RMKS], cmasgnmain.[MIST_RMKS]),
				 [FU_QC_CNT] = ISNULL(tmp.[FU_QC_CNT], cmasgnmain.[FU_QC_CNT]),
				 [ENUM_RSLT_CD_RAW] = ISNULL(tmp.[ENUM_RSLT_CD_RAW], cmasgnmain.[ENUM_RSLT_CD_RAW]),
		         [MAIL_ADDR_BLDG_SERL] = ISNULL(tmp.[MAIL_ADDR_BLDG_SERL], cmasgnmain.[MAIL_ADDR_BLDG_SERL]),
		         [MAIL_ADDR_LAT] = ISNULL(tmp.[MAIL_ADDR_LAT], cmasgnmain.[MAIL_ADDR_LAT]),
		         [MAIL_ADDR_LONG] = ISNULL(tmp.[MAIL_ADDR_LONG], cmasgnmain.[MAIL_ADDR_LONG]),
		         [MAIL_ADDR_CHI] = ISNULL(tmp.[MAIL_ADDR_CHI], cmasgnmain.[MAIL_ADDR_CHI]),
		         [FW_ADDR_ENG_1] = ISNULL(tmp.[FW_ADDR_ENG_1], cmasgnmain.[FW_ADDR_ENG_1]),
		         [FW_ADDR_ENG_2] = ISNULL(tmp.[FW_ADDR_ENG_2], cmasgnmain.[FW_ADDR_ENG_2]),
		         [FW_ADDR_ENG_3] = ISNULL(tmp.[FW_ADDR_ENG_3], cmasgnmain.[FW_ADDR_ENG_3]),
		         [FW_ADDR_ENG_4] = ISNULL(tmp.[FW_ADDR_ENG_4], cmasgnmain.[FW_ADDR_ENG_4]),
		         [FW_ADDR_TPU] = ISNULL(tmp.[FW_ADDR_TPU], cmasgnmain.[FW_ADDR_TPU]),
		         [FW_ADDR_SB] = ISNULL(tmp.[FW_ADDR_SB], cmasgnmain.[FW_ADDR_SB]),
		         [FW_ADDR_PLOT] = ISNULL(tmp.[FW_ADDR_PLOT], cmasgnmain.[FW_ADDR_PLOT]),
		         [FW_ADDR_BLDG_SERL] = ISNULL(tmp.[FW_ADDR_BLDG_SERL], cmasgnmain.[FW_ADDR_BLDG_SERL]),
		         [FW_ADDR_LAT] = ISNULL(tmp.[FW_ADDR_LAT], cmasgnmain.[FW_ADDR_LAT]),
		         [FW_ADDR_LONG] = ISNULL(tmp.[FW_ADDR_LONG], cmasgnmain.[FW_ADDR_LONG]),
		         [FW_ADDR_CHI] = ISNULL(tmp.[FW_ADDR_CHI], cmasgnmain.[FW_ADDR_CHI]),
                 [WRG_ADDR_IND] = ISNULL(tmp.[WRG_ADDR_IND], cmasgnmain.[WRG_ADDR_IND]),
                 [REACT_EXP_DATE] = ISNULL(tmp.[REACT_EXP_DATE], cmasgnmain.[REACT_EXP_DATE]),
				 [BYPA_IND] = ISNULL(tmp.[BYPA_IND], cmasgnmain.[BYPA_IND]),
                 [CONF_MO_HH_IND] = ISNULL(tmp.[CONF_MO_HH_IND], cmasgnmain.[CONF_MO_HH_IND]),
                 [REQ_HH_LTR_IND] = ISNULL(tmp.[REQ_HH_LTR_IND], cmasgnmain.[REQ_HH_LTR_IND]),
                 [SKP_RMDR_IND] = ISNULL(tmp.[SKP_RMDR_IND], cmasgnmain.[SKP_RMDR_IND]),
				 [PREV_EOE_RSN_CD] = ISNULL(tmp.[PREV_EOE_RSN_CD], cmasgnmain.[PREV_EOE_RSN_CD]),
				 [COND_SRCH_IND] =  ISNULL(tmp.[COND_SRCH_IND], cmasgnmain.[COND_SRCH_IND]),
				 [HC_IND] = ISNULL(tmp.[HC_IND], cmasgnmain.[HC_IND]),
				 [OQ_EXP_DATE] = CASE WHEN tmp.[OQ_EXP_DATE] = '1900-01-01 23:59:00.000' THEN NULL ELSE ISNULL(tmp.[OQ_EXP_DATE], cmasgnmain.[OQ_EXP_DATE]) END
			OUTPUT tmp.ASGN_UID
			INTO #sResultTable_SetCM_ASGN_MAIN
            FROM [Census].[CM_ASGN_MAIN] cmasgnmain INNER JOIN #sDataSet_SetCM_ASGN_MAIN tmp ON cmasgnmain.ASGN_UID = tmp.ASGN_UID
            WHERE tmp.RecordState = 'U'
        END

        IF EXISTS (SELECT 1 FROM #sDataSet_SetCM_ASGN_MAIN WHERE RecordState = 'D') BEGIN
            UPDATE cmasgnmain SET 
				[DEL_IND] = 'Y', 
				ASGN_STS = 'DEL',
				[DEL_DT] = @sNow, 
				[DEL_BY_USR_ID] = @sUserID,
				[DEL_BY_STF_POSN_UID] = @sStaffPositionUID,
				[UPD_DT] = @sNow, 
				[UPD_BY_USR_ID] = @sUserID,
				[UPD_BY_STF_POSN_UID] = @sStaffPositionUID,
				[VER_NO] = cmasgnmain.[VER_NO] + 1
			OUTPUT tmp.ASGN_UID
			INTO #sResultTable_SetCM_ASGN_MAIN
            FROM [Census].[CM_ASGN_MAIN] cmasgnmain 
			INNER JOIN #sDataSet_SetCM_ASGN_MAIN tmp ON cmasgnmain.ASGN_UID = tmp.ASGN_UID
            WHERE tmp.RecordState = 'D'
        END
		
        SET @pResultJson = (SELECT ASGN_UID FROM #sResultTable_SetCM_ASGN_MAIN FOR JSON PATH)
        IF @sIsReturnResult = 'Y' BEGIN
            SELECT ASGN_UID FROM #sResultTable_SetCM_ASGN_MAIN 
        END

        IF @sBeginTranCount = 0 AND @@TRANCOUNT > 0 BEGIN
            IF @sTestMode = 1 BEGIN
                ROLLBACK
            END
            ELSE BEGIN
                COMMIT
            END
        END

    END TRY
    BEGIN CATCH
        DECLARE 
            @sErrorNum int,
            @sCatchErrorMessage nvarchar(4000),
            @xstate int,
            @sProcedureName varchar(100),
            @sRtnCodeLog int,
            @sErrMessageLog nvarchar(4000)
        
        SET @sErrorNum = ERROR_NUMBER()
        SET @sCatchErrorMessage = ERROR_MESSAGE()
        SET @xstate = XACT_STATE()
        SET @sProcedureName = OBJECT_NAME(@@PROCID)
	
        IF ISNULL(@pErrCode, 0) = 0 BEGIN
            SET @pErrCode = @sErrorNum
        END
            
        IF @pErrMsg = '' BEGIN
            SET @pErrMsg = @sCatchErrorMessage
        END

        IF @sBeginTranCount = 0 BEGIN
            IF @xstate <> 0 BEGIN
                ROLLBACK
            END

			--ErrorMsg Handling
			SET @pErrMsg = CONCAT('(', @sErrorNum, ') ', @sCatchErrorMessage)
        END
        ELSE
            THROW

    END CATCH
    
    DROP TABLE IF EXISTS #sResultTable_SetCM_ASGN_MAIN
    DROP TABLE IF EXISTS #BaseJsonDataTable
    DROP TABLE IF EXISTS #sDataSet_SetCM_ASGN_MAIN
END
GO


