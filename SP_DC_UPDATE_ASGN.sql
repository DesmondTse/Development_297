ALTER   PROCEDURE [Census].[SP_DC_UPDATE_ASGN]
    (
        @pBaseJson        nvarchar(max),
        @pJson            nvarchar(max),
		@pREFNOJson       nvarchar(max),
		@pMAPJson         nvarchar(max),
		@pALLOCJson       nvarchar(max),
		--@pALLOCHistJson   nvarchar(max),
		@pHHJson          nvarchar(max),
		@pHldLstJson     nvarchar(max),
		@pActyJson        nvarchar(max),
		@pRMKJson         nvarchar(max),
		@pLTRJson         nvarchar(max),
		@pBKMJson		  nvarchar(max),
		@pAprvReqJson	  nvarchar(max),
		@pNotifUsrJsonWA  nvarchar(max) OUTPUT,
        @pResultJson      nvarchar(max) OUTPUT,
        @pErrCode         int = 0 OUTPUT,
        @pErrMsg          nvarchar(200) OUTPUT
    )
AS
BEGIN
    SET NOCOUNT ON
    SET XACT_ABORT ON
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED

	IF 1=0 BEGIN
	   SELECT 0
	   SET FMTONLY OFF
	END

	DECLARE @sBeginTranCount int = 0,
			@sIsReturnResult char(1),
			@sTestMode	     int = 0,
			@sUserID		 varchar(20),
			@sStaffPositionUID	int,
			@WRG_ADDR_UID_BEV VARCHAR(1),
			@WRG_ADDR_UID_AFT VARCHAR(1),
		    @RecordStatus VARCHAR(1),
		    @pAsgnUidJson nvarchar(max);

	SET @sBeginTranCount = @@TRANCOUNT

	DECLARE @errorMsg nvarchar(max);

	BEGIN TRY
		IF @sBeginTranCount = 0 BEGIN
			BEGIN TRAN
		END

		SELECT *
		INTO   #BaseJsonDataTable
		FROM
			Census.FN_GetBaseJson(@pBaseJson)

		IF EXISTS(SELECT 1 FROM #BaseJsonDataTable b) BEGIN
            SELECT TOP 1 @sIsReturnResult = ISNULL(b.IsReturnResult, 'N'), @sTestMode = ISNULL(b.TestMode, 0), @sUserID = b.UserID, @sStaffPositionUID = ISNULL(b.StaffPositionUID, 0)
			FROM #BaseJsonDataTable b
        END
		
		--CM_ASGN_MAIN
		SELECT *
		INTO #tempAsgn
		FROM
			OPENJSON(@pJson)
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
			[WRG_ADDR_IND] varchar(1) '$.WRG_ADDR_IND',
			[REQ_HH_LTR_IND] varchar(1) '$.REQ_HH_LTR_IND',
			[SKP_RMDR_IND] varchar(1) '$.SKP_RMDR_IND',
			[COND_SRCH_IND] varchar(1) '$.COND_SRCH_IND',
			RecordState varchar(1)
		)

		--Find the [ASGN_UID] by GUID if the record state is not insert
		IF EXISTS(SELECT 1 FROM #tempAsgn WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0 AND [RecordState] <> 'I')
		BEGIN
			UPDATE #tempAsgn SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempAsgn temp
											   INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[GUID]
											   WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0 AND temp.[RecordState] <> 'I'

			set @pJson = (SELECT * FROM #tempAsgn FOR JSON PATH)
		END

		SELECT @WRG_ADDR_UID_BEV = [WRG_ADDR_IND] FROM [CENSUS].[CM_ASGN_MAIN] WHERE [ASGN_UID] IN (SELECT [ASGN_UID] FROM #tempAsgn)
		--Excute assignment main stored prod.
		exec census.SP_CM_SET_ASGN_MAIN @pBaseJson, @pJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		SET @pAsgnUidJson = @pResultJson
		SELECT @WRG_ADDR_UID_AFT = [WRG_ADDR_IND] FROM [CENSUS].[CM_ASGN_MAIN] WHERE [ASGN_UID] IN (SELECT [ASGN_UID] FROM #tempAsgn)
		IF(
			(@WRG_ADDR_UID_BEV = 'N' AND @WRG_ADDR_UID_AFT = 'Y')
			OR
			(@RecordStatus = 'I' AND @WRG_ADDR_UID_AFT = 'Y')
		)
		BEGIN
			exec [Census].[SP_DC_SEND_USR_NOTIF_WRG_ADDR]  @pBaseJson, @pAsgnUidJson, 'ASGNWRGADDR', @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
			SET @pNotifUsrJsonWA = @pResultJson
		END

		SELECT * into #tempRefNo
		FROM
			OPENJSON(@pREFNOJson)
		WITH 
		(
			[ASGN_UID] bigint '$.ASGN_UID', [ASGN_GUID] uniqueidentifier '$.ASGN_GUID', [FLD_ID] varchar(20) '$.FLD_ID', [FLD_VAL] nvarchar(2000) '$.FLD_VAL', RecordState varchar(1)
		)

		--Find the [ASGN_UID] by ASGN_GUID
		IF EXISTS(SELECT 1 FROM #tempRefNo WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN
			UPDATE #tempRefNo SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempRefNo temp
							   INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
							   WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pREFNOJson = (SELECT * FROM #tempRefNo FOR JSON PATH)
		END

		SELECT * into #tempMap
		FROM
			OPENJSON(@pMapJson)
		WITH 
		(
			[ASGN_UID] bigint '$.ASGN_UID', [MAP_TYP] varchar(3) '$.MAP_TYP', [FILE_NAME] nvarchar(250) '$.FILE_NAME', [FILE_PATH] nvarchar(500) '$.FILE_PATH', 
			RecordState varchar(1)
		)

		--UPDATE #tempMap SET [ASGN_UID] = (select top 1 [ASGN_UID] from #tempAsgn_Result)  where RecordState = 'I';;

		set @pMapJson = (SELECT * FROM #tempMap FOR JSON AUTO)
			
		SELECT * into #tempAlloc
		FROM
			OPENJSON(@pAllocJson)
		WITH 
		(
			[ASGN_UID] bigint '$.ASGN_UID', 
			[POSN_UID_ORIG] int '$.POSN_UID_ORIG', 
			[OU_UID_ORIG] int '$.OU_UID_ORIG', 
			[STF_POSN_UID_ORIG] int '$.STF_POSN_UID_ORIG', 
			[POSN_CD_ORIG] varchar(20) '$.POSN_CD_ORIG', 
			[OU_CD_ORIG] varchar(10) '$.OU_CD_ORIG', 
			[OU_TYP_CD_ORIG] varchar(10) '$.OU_TYP_CD_ORIG', 
			[POSN_UID_ENUM] int '$.POSN_UID_ENUM', 
			[OU_UID_ENUM] int '$.OU_UID_ENUM', 
			[STF_POSN_UID_ENUM] int '$.STF_POSN_UID_ENUM', 
			[POSN_CD_ENUM] varchar(20) '$.POSN_CD_ENUM', 
			[OU_CD_ENUM] varchar(10) '$.OU_CD_ENUM', 
			[OU_TYP_CD_ENUM] varchar(10) '$.OU_TYP_CD_ENUM', 
			[POSN_UID_OQ] int '$.POSN_UID_OQ', 
			[OU_UID_OQ] int '$.OU_UID_OQ', 
			[STF_POSN_UID_OQ] int '$.STF_POSN_UID_OQ', 
			[POSN_CD_OQ] varchar(20) '$.POSN_CD_OQ', 
			[OU_CD_OQ] varchar(10) '$.OU_CD_OQ', 
			[OU_TYP_CD_OQ] varchar(10) '$.OU_TYP_CD_OQ', 
			[POSN_UID_CSC] int '$.POSN_UID_CSC', 
			[OU_UID_CSC] int '$.OU_UID_CSC', 
			[STF_POSN_UID_CSC] int '$.STF_POSN_UID_CSC', 
			[POSN_CD_CSC] varchar(20) '$.POSN_CD_CSC', 
			[OU_CD_CSC] varchar(10) '$.OU_CD_CSC', 
			[OU_TYP_CD_CSC] varchar(10) '$.OU_TYP_CD_CSC', 
			[ALLOC_TO_IND] varchar(1) '$.ALLOC_TO_IND', 
			[POSN_UID_FU] int '$.POSN_UID_FU', 
			[OU_UID_FU] int '$.OU_UID_FU', 
			[STF_POSN_UID_FU] int '$.STF_POSN_UID_FU', 
			[POSN_CD_FU] varchar(20) '$.POSN_CD_FU', 
			[OU_CD_FU] varchar(10) '$.OU_CD_FU', 
			[OU_TYP_CD_FU] varchar(10) '$.OU_TYP_CD_FU', 
			[POSN_UID_CET] int '$.POSN_UID_CET', 
			[OU_UID_CET] int '$.OU_UID_CET', 
			[STF_POSN_UID_CET] int '$.STF_POSN_UID_CET', 
			[POSN_CD_CET] varchar(20) '$.POSN_CD_CET', 
			[OU_CD_CET] varchar(10) '$.OU_CD_CET', 
			[OU_TYP_CD_CET] varchar(10) '$.OU_TYP_CD_CET', 
			RecordState varchar(1),
			[ASGN_GUID] uniqueidentifier '$.ASGN_GUID',
			[ALLOC_TYP] varchar(3) '$.ALLOC_TYP'
		)

		--Find the [ASGN_UID] by ASGN_GUID
		IF EXISTS(SELECT 1 FROM #tempAlloc WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN
			UPDATE #tempAlloc SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempAlloc temp
							   INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
							   WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pAllocJson = (SELECT * FROM #tempAlloc FOR JSON PATH)
		END


		--Create Allocation History
		DECLARE @sAllocHistJson nvarchar(max);
		
		CREATE TABLE #tempAllocHist(
			[ASGN_UID] bigint,
			[ALLOC_TYP] varchar(3),
			[POSN_UID] int,
			[STF_POSN_UID] int, 
			[ALLOC_SUB_TYP] varchar(1),
			[OU_UID] int,
			[SEQ_NO] int,
			[RecordState] varchar(1)
		)
		IF EXISTS(SELECT 1 FROM #tempAlloc)
		BEGIN
			INSERT INTO #tempAllocHist(
				[ASGN_UID],
				[ALLOC_TYP],
				[POSN_UID],
				[STF_POSN_UID], 
				[ALLOC_SUB_TYP],
				[OU_UID],
				[SEQ_NO],
				[RecordState]
			)
			SELECT temp.[ASGN_UID],
				   temp.[ALLOC_TYP],
				   posn.[POSN_UID],
				   temp.[STF_POSN_UID_CET],
				   '4',
				   posn.[OU_UID],
				   ISNULL(allocHist.SEQ_NO, 0) + 1 [SEQ_NO],  -- Mantis#4251
				   'I'
			FROM #tempAlloc temp
			INNER JOIN [Census].[VW_CM_GET_CURR_STF_POSN] stfPosn ON stfPosn.[STF_POSN_UID] = temp.[STF_POSN_UID_CET]
			INNER JOIN [Census].[CM_POSN] posn ON posn.[POSN_UID] = stfPosn.[POSN_UID]
			OUTER APPLY (
				SELECT TOP(1) * FROM [Census].[CM_ASGN_ALLOC_HIST] allocHist 
				WHERE allocHist.[ASGN_UID] = temp.[ASGN_UID]
				ORDER BY allocHist.SEQ_NO DESC
			) allocHist  -- Mantis#4251
			WHERE temp.[ALLOC_TYP] = 'RCE'
			

			INSERT INTO #tempAllocHist(
				[ASGN_UID],
				[ALLOC_TYP],
				[POSN_UID],
				[STF_POSN_UID], 
				[ALLOC_SUB_TYP],
				[OU_UID],
				[SEQ_NO],
				[RecordState]
			)
			SELECT temp.[ASGN_UID],
				   temp.[ALLOC_TYP],
				    posn.[POSN_UID],
				   temp.[STF_POSN_UID_FU],
				   '1',
				   posn.[OU_UID],
				   ISNULL(allocHist.SEQ_NO, 0) + 1 [SEQ_NO],  -- Mantis#4251
				   'I'
			FROM #tempAlloc temp
			INNER JOIN [Census].[VW_CM_GET_CURR_STF_POSN] stfPosn ON stfPosn.[STF_POSN_UID] = temp.[STF_POSN_UID_FU]
			INNER JOIN [Census].[CM_POSN] posn ON posn.[POSN_UID] = stfPosn.[POSN_UID]
			OUTER APPLY (
				SELECT TOP(1) * FROM [Census].[CM_ASGN_ALLOC_HIST] allocHist 
				WHERE allocHist.[ASGN_UID] = temp.[ASGN_UID]
				ORDER BY allocHist.SEQ_NO DESC
			) allocHist  -- Mantis#4251
			WHERE temp.[ALLOC_TYP] = 'FU'
		END

		SET @sAllocHistJson = (SELECT * FROM #tempAllocHist FOR JSON AUTO);


		SELECT * into #tempHldLst
		FROM
			OPENJSON(@pHldLstJson)
		WITH 
		(
			[ASGN_UID] bigint '$.ASGN_UID', [ASGN_GUID] uniqueidentifier '$.ASGN_GUID', [HLD_TYP] varchar(1) '$.HLD_TYP', [HLD_RSN] varchar(250) '$.HLD_RSN', [HLD_STS] varchar(1) '$.HLD_STS', 
			[CRE_DT] datetime '$.CRE_DT', [CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', [CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', [UPD_DT] datetime '$.UPD_DT', 
			[UPD_BY_USR_ID] varchar(20) '$.UPD_BY_USR_ID', [UPD_BY_STF_POSN_UID] int '$.UPD_BY_STF_POSN_UID', [VER_NO] int '$.VER_NO', RecordState varchar(1)
		)

		--Find the [ASGN_UID] by ASGN_GUID
		IF EXISTS(SELECT 1 FROM #tempHldLst WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN
			UPDATE #tempHldLst SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempAlloc temp
							   INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
							   WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pHldLstJson = (SELECT * FROM #tempHldLst FOR JSON PATH)
		END

		--Igrone no changing record 
		DELETE temp 
		FROM #tempHldLst temp
		INNER JOIN [Census].[CM_ASGN_HLD_LST] asgnHldLst ON asgnHldLst.[ASGN_UID] = temp.[ASGN_UID] AND asgnHldLst.[HLD_STS] = temp.[HLD_STS]

		--If [Census].[CM_ASGN_HLD_LST] exists the assignment record, set the record state to be 'U'
		UPDATE #tempHldLst SET [RecordState] = 'U' FROM #tempHldLst temp
													 INNER JOIN [Census].[CM_ASGN_HLD_LST] asgnHldLst ON asgnHldLst.[ASGN_UID] = temp.[ASGN_UID] 
													 WHERE temp.RecordState = 'I'

		UPDATE #tempHldLst SET 
		[RecordState] = 'I' 
		FROM #tempHldLst temp
		LEFT JOIN [Census].[CM_ASGN_HLD_LST] asgnHldLst ON asgnHldLst.[ASGN_UID] = temp.[ASGN_UID] 
		WHERE temp.RecordState = 'U'
		AND asgnHldLst.[ASGN_UID] IS NULL

		set @pHldLstJson = (SELECT * FROM #tempHldLst FOR JSON PATH)

		--Assignment Activity - Hold/Unhold Assignment
		IF EXISTS (SELECT 1 FROM #tempHldLst)
		BEGIN
		
			DECLARE @sHldActyUid int = (SELECT TOP(1) [ACTY_UID] FROM [Census].[CM_REF_ASGN_ACTY] WITH (NOLOCK)  WHERE [ACTY_CD] = 'ASGN_HLD_ACTY')
			DECLARE @sStfName varchar(100) = (
				SELECT TOP(1) ISNULL(stfProf.[NAME_ENG], @sUserID) FROM [Census].[VW_CM_GET_CURR_STF_POSN] stfPosn
				LEFT JOIN [Census].[CM_STF_PROF] stfProf  WITH (NOLOCK) ON stfProf.[STF_UID] = stfPosn.[STF_UID]
				WHERE stfPosn.[STF_POSN_UID] = @sStaffPositionUID
			)

			DECLARE @sAsgnActyJson nvarchar(max) = (
				SELECT asgn.[ASGN_UID],
					   @sHldActyUid [ACTY_UID],
						CONCAT(@sStfName,' ', hldStsCd.[LBL_ENG], ' the assignment', ' - Reason: ' + asgn.[HLD_RSN]) [OTH_DESCR],
					   'I' [RecordState]
				FROM #tempHldLst asgn
				LEFT JOIN [Census].[CM_CD_TBL_DTL] hldStsCd  WITH (NOLOCK) ON hldStsCd.[CD_TYP] = 'HLDSTS' AND hldStsCd.[CD_VAL] = IIF(asgn.[HLD_STS] = 'D', 'R', asgn.[HLD_STS])
				FOR JSON PATH
			)

			exec census.SP_CM_SET_ASGN_ACTY @pBaseJson, @sAsgnActyJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		END

		IF EXISTS(SELECT 1 FROM #tempHldLst temp 
				  INNER JOIN [Census].[CM_ASGN_HLD_LST] asgnHldLst WITH (NOLOCK)  ON asgnHldLst.[ASGN_UID] = temp.[ASGN_UID] AND asgnHldLst.[HLD_STS] = 'H'
				  WHERE temp.[HLD_STS] in ('R', 'D')
				  AND asgnHldLst.[HLD_TYP] in ('1', '2') 
				  AND temp.[HLD_TYP] not in ('1', '2')
		)
		BEGIN
			DECLARE @sAsgnLst nvarchar(max) = (SELECT STRING_AGG(asgnRefNo.[FLD_VAL], ', ') FROM #tempHldLst temp 
												INNER JOIN [Census].[CM_ASGN_HLD_LST] asgnHldLst  WITH (NOLOCK) ON asgnHldLst.[ASGN_UID] = temp.[ASGN_UID] AND asgnHldLst.[HLD_STS] = 'H'
												INNER JOIN [Census].[CM_ASGN_REF_NO] asgnRefNo  WITH (NOLOCK) ON asgnRefNo.[ASGN_UID] = temp.[ASGN_UID] AND asgnRefNo.[FLD_ID] = 'REFNO'
												WHERE temp.[HLD_STS] in ('R', 'D')
												AND asgnHldLst.[HLD_TYP] in ('1', '2') 
												AND temp.[HLD_TYP] not in ('1', '2')
											  )

			SET @errorMsg = CONCAT('The assignment ',@sAsgnLst,' is held by coding and editing team')
			RAISERROR(@errorMsg, 16 , 1);
			RETURN;
		END

		IF EXISTS(SELECT 1 FROM #tempHldLst temp 
				  INNER JOIN [Census].[CM_ASGN_HLD_LST] asgnHldLst WITH (NOLOCK)  ON asgnHldLst.[ASGN_UID] = temp.[ASGN_UID] AND asgnHldLst.[HLD_STS] = 'H'
				  WHERE temp.[HLD_STS] in ('R', 'D')
				  AND  temp.[HLD_TYP] <> '3' 
				  AND asgnHldLst.[HLD_TYP] = '3'
				  )
		BEGIN
			DECLARE @sAsgnLst2 nvarchar(max) = (SELECT STRING_AGG(asgnRefNo.[FLD_VAL], ', ') FROM #tempHldLst temp 
												INNER JOIN [Census].[CM_ASGN_HLD_LST] asgnHldLst  WITH (NOLOCK) ON asgnHldLst.[ASGN_UID] = temp.[ASGN_UID] AND asgnHldLst.[HLD_STS] = 'H'
												INNER JOIN [Census].[CM_ASGN_REF_NO] asgnRefNo  WITH (NOLOCK) ON asgnRefNo.[ASGN_UID] = temp.[ASGN_UID] AND asgnRefNo.[FLD_ID] = 'REFNO'
												WHERE temp.[HLD_STS] in ('R', 'D')
												AND  temp.[HLD_TYP] = '3'
												AND asgnHldLst.[HLD_TYP] <> '3'
											  )

			SET @errorMsg = CONCAT('The assignment ',@sAsgnLst2,' is held by field staff team')
			RAISERROR(@errorMsg, 16 , 1);
			RETURN;
		END

		--UPDATE #tempHldLst SET [ASGN_UID] = (select top 1 [ASGN_UID] from #tempAsgn_Result)  where RecordState = 'I';

		set @pHldLstJson = (SELECT * FROM #tempHldLst FOR JSON AUTO)
			
		SELECT *
		INTO #tempActy
		FROM
			OPENJSON(@pActyJson)
		WITH (
			[ASGN_ACTY_UID] bigint '$.ASGN_ACTY_UID', 
			[GUID] uniqueidentifier '$.GUID',
			[ASGN_UID] bigint '$.ASGN_UID', 
			[ASGN_GUID] uniqueidentifier '$.ASGN_GUID',
			[ACTY_UID] int '$.ACTY_UID',
			[ACTY_CD] varchar(20) '$.ACTY_CD',
			[SRVY_UID] int '$.SRVY_UID',
			[OTH_DESCR] nvarchar(250) '$.OTH_DESCR', 
			[SEL_APRV_POSN_UID] int '$.SEL_APRV_POSN_UID', 
			[SEL_APRV_POSN_CD] varchar(20) '$.SEL_APRV_POSN_CD', 
			[SEL_APRV_POSN_NAME_ENG] varchar(100) '$.SEL_APRV_POSN_NAME_ENG', 
			[SEL_APRV_POSN_NAME_CHI] nvarchar(100) '$.SEL_APRV_POSN_NAME_CHI', 
			[APRV_POSN_UID] int '$.APRV_POSN_UID', 
			[APRV_POSN_CD] varchar(20) '$.APRV_POSN_CD', 
			[APRV_POSN_NAME_ENG] varchar(100) '$.APRV_POSN_NAME_ENG', 
			[APRV_POSN_NAME_CHI] nvarchar(100) '$.APRV_POSN_NAME_CHI', 
			[APRV_RMKS] nvarchar(500) '$.APRV_RMKS', 
			[RJCT_RSN] nvarchar(500) '$.RJCT_RSN', 
			[CRE_DT] datetime '$.CRE_DT', 
			[CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', 
			[CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', 
			RecordState varchar(1)
		)

		--[CM_ASGN_ACTY] Find the [ASGN_ACTY_UID] by [GUID]
		IF EXISTS(SELECT 1 FROM #tempActy WHERE [Census].[FN_IntIsNullOrZero]([ASGN_ACTY_UID]) = 0 AND RecordState <> 'I')
		BEGIN
			UPDATE #tempActy SET [ASGN_ACTY_UID] = asgnAprvReq.[ASGN_ACTY_UID] FROM #tempActy temp
							   INNER JOIN [Census].[CM_ASGN_APRV_REQ] asgnAprvReq ON asgnAprvReq.[GUID] = temp.[GUID]
							   WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_ACTY_UID]) = 0 AND RecordState <> 'I'

			set @pActyJson = (SELECT * FROM #tempActy FOR JSON PATH)
		END

		--[CM_ASGN_ACTY] Find the [ACTY_UID] by [SRVY_UID] AND [ACTY_CD]
		IF EXISTS(SELECT 1 FROM #tempActy WHERE [Census].[FN_IntIsNullOrZero]([ACTY_UID]) = 0)
		BEGIN
			UPDATE #tempActy SET [ACTY_UID] = refAsgnActy.[ACTY_UID] FROM #tempActy temp
												INNER JOIN [Census].[CM_REF_ASGN_ACTY] refAsgnActy ON refAsgnActy.[SRVY_UID] = temp.[SRVY_UID] AND refAsgnActy.[ACTY_CD] = temp.[ACTY_CD]
												WHERE [Census].[FN_IntIsNullOrZero](temp.[ACTY_UID]) = 0

			set @pActyJson = (SELECT * FROM #tempActy FOR JSON AUTO)
		END

		--[CM_ASGN_ACTY] Find the [ASGN_UID] by [ASGN_GUID]
		IF EXISTS(SELECT 1 FROM #tempActy WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN
			UPDATE #tempActy SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempActy temp
												INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
												WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pActyJson = (SELECT * FROM #tempActy FOR JSON AUTO)
		END

		--UPDATE #temp_RMK SET [ASGN_UID] = (select top 1 [ASGN_UID] from #tempAsgn_Result)  where RecordState = 'I';

		SELECT * into #tempLtr
		FROM
			OPENJSON(@pLTRJson)
		WITH 
		(
				[ASGN_UID] bigint '$.ASGN_UID', [LTR_PRN_IND] varchar(1) '$.LTR_PRN_IND', [LTR_ISS_IND] varchar(1) '$.LTR_ISS_IND', [LTR_ISS_DT] datetime '$.LTR_ISS_DT', 
				[MAIL_RJCT_DT] datetime '$.MAIL_RJCT_DT', [MAIL_RJCT_RSN] nvarchar(250) '$.MAIL_RJCT_RSN', [RMDR_PRN_IND] varchar(1) '$.RMDR_PRN_IND', 
				[RMDR_ISS_IND] varchar(1) '$.RMDR_ISS_IND', [RMDR_ISS_DT] datetime '$.RMDR_ISS_DT', [CRE_DT] datetime '$.CRE_DT', 
				[CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', [CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', [UPD_DT] datetime '$.UPD_DT', 
				[UPD_BY_USR_ID] varchar(20) '$.UPD_BY_USR_ID', [UPD_BY_STF_POSN_UID] int '$.UPD_BY_STF_POSN_UID', [VER_NO] int '$.VER_NO', RecordState varchar(1)
		)

		--UPDATE #tempLtr SET [ASGN_UID] = (select top 1 [ASGN_UID] from #sDataSet_SetCM_ASGN_LTR_Result)  where RecordState = 'I';

		set @pLTRJson = (SELECT * FROM #tempLtr FOR JSON AUTO)


		--CM_ASGN_HH_CONT
		SELECT * 
		into #tempHh
		FROM
			OPENJSON(@pHHJson)
		WITH 
		(
			[ASGN_GUID] uniqueidentifier '$.ASGN_GUID', 
			[HH_CONT_UID] bigint '$.HH_CONT_UID', 
			[ASGN_UID] bigint '$.ASGN_UID', 
			[SEQ_NO] int '$.SEQ_NO', 
			[GUID] uniqueidentifier '$.GUID', 
			[ENQ_IND] varchar(1) '$.ENQ_IND', 
			[INTV_IND] varchar(1) '$.INTV_IND', 
			[APPT_IND] varchar(1) '$.APPT_IND', 
			[APPT_REQR_IND] varchar(1) '$.APPT_REQR_IND', 
			[TITL] varchar(4) '$.TITL', 
			[SURN_ENG] varchar(50) '$.SURN_ENG', 
			[OTHN_ENG] varchar(50) '$.OTHN_ENG', 
			[SURN_CHI] nvarchar(5) '$.SURN_CHI', 
			[OTHN_CHI] nvarchar(15) '$.OTHN_CHI', 
			[NAME_ENG] varchar(50) '$.NAME_ENG', 
			[NAME_CHI] nvarchar(20) '$.NAME_CHI', 
			[TEL_1] varchar(20) '$.TEL_1', 
			[TEL_2] varchar(20) '$.TEL_2', 
			[EML] varchar(50) '$.EML', 
			[EML_IND] varchar(1) '$.EML_IND', 
			[RMKS] nvarchar(500) '$.RMKS', 
			[DFLT_CONT_IND] varchar(1) '$.DFLT_CONT_IND', 
			[WRG_TEL_NO_IND] varchar(1) '$.WRG_TEL_NO_IND', 
			[WRG_TEL_RPT_BY] varchar(2) '$.WRG_TEL_RPT_BY', 
			[LINK_ID] uniqueidentifier '$.LINK_ID', 
			[STS] varchar(1) '$.STS', 
			[CONT_ADDR_ENG] varchar(255) '$.CONT_ADDR_ENG', 
			[CONT_ADDR_CHI] nvarchar(255) '$.CONT_ADDR_CHI', 
			[OQ_NEXT_ROUND_IND] varchar(1) '$.OQ_NEXT_ROUND_IND', 
			[RESP_LANG_USED] varchar(10) '$.RESP_LANG_USED', 
			[TEL_EXT_1] varchar(4) '$.TEL_EXT_1', 
			[TEL_EXT_2] varchar(4) '$.TEL_EXT_2', 
			[RFSL_IND] varchar(1) '$.RFSL_IND', 
			[RFSL_LVL] tinyint '$.RFSL_LVL', 
			[EFC_CONT_UID] bigint '$.EFC_CONT_UID', 
			[RESPT_ATT] varchar(1) '$.RESPT_ATT', 
			[RESPT_ATT_RMK] nvarchar(500) '$.RESPT_ATT_RMK', 
			[RESPT_LNG] nvarchar(50) '$.RESPT_LNG', 
			[INT_OQ_IND] varchar(1) '$.INT_OQ_IND', 
			[PREF_MDE] varchar(1) '$.PREF_MDE', 
			[PREF_TIME_SLOT] nvarchar(1) '$.PREF_TIME_SLOT', 
			[PREF_TIME_DTL] nvarchar(100) '$.PREF_TIME_DTL', 
			[WRG_CONT_IND] varchar(1) '$.WRG_CONT_IND', 
			[RESPT_IND] varchar(1) '$.RESPT_IND', 
			[WRG_TEL_QC_LOG_UID] bigint '$.WRG_TEL_QC_LOG_UID', 
			[SM_RESPB_BRK_IND] varchar(1) '$.SM_RESPB_BRK_IND',
			[PP_NO] varchar(2) '$.PP_NO',
			RecordState varchar(1)
		)

		--[CM_ASGN_HH_CONT]: For Offline mode - Find the HH_CONT_UID by GUID if the action is not insert
		IF EXISTS(SELECT 1 FROM #tempHh WHERE RecordState <> 'I' AND [Census].[FN_IntIsNullOrZero]([HH_CONT_UID]) = 0)
		BEGIN
			UPDATE #tempHh SET [HH_CONT_UID] = asgnHhCont.[HH_CONT_UID] FROM #tempHh temp
												INNER JOIN [Census].[CM_ASGN_HH_CONT] asgnHhCont ON asgnHhCont.[GUID] = temp.[GUID]
												WHERE temp.RecordState <> 'I' AND [Census].[FN_IntIsNullOrZero](temp.[HH_CONT_UID]) = 0

			set @pHHJson = (SELECT * FROM #tempHh FOR JSON AUTO)
		END

		--[CM_ASGN_HH_CONT]: For Offline mode - Find the ASGN_UID by ASGN_GUID if the action is not insert
		IF EXISTS(SELECT 1 FROM #tempHh WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN
			UPDATE #tempHh SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempHh temp
												INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
												WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pHHJson = (SELECT * FROM #tempHh FOR JSON AUTO)
		END

		--[CM_ASGN_HH_CONT]:
		IF EXISTS(SELECT 1 FROM #tempHh WHERE [LINK_ID] IS NULL AND RecordState = 'I')
		BEGIN
			UPDATE #tempHh SET [LINK_ID] = temp.[GUID] FROM #tempHh temp
											WHERE temp.[LINK_ID] IS NULL AND temp.RecordState = 'I'

			set @pHHJson = (SELECT * FROM #tempHh FOR JSON AUTO)
		END

		--[CM_ASGN_APRV_REQ]
		SELECT *
		INTO #tempAprvReq
		FROM
			OPENJSON(@pAprvReqJson)
		WITH (
			[APRV_REQ_UID] bigint '$.APRV_REQ_UID', 
			[ASGN_UID] bigint '$.ASGN_UID',
			[ASGN_GUID] uniqueidentifier '$.ASGN_GUID',
			[REQ_BY_STF_UID] int '$.REQ_BY_STF_UID', 
			[REQ_BY_STF_NO] varchar(20) '$.REQ_BY_STF_NO', 
			[REQ_BY_STF_NAME_ENG] varchar(50) '$.REQ_BY_STF_NAME_ENG', 
			[REQ_BY_STF_NAME_CHI] nvarchar(20) '$.REQ_BY_STF_NAME_CHI', 
			[REQ_BY_POSN_UID] int '$.REQ_BY_POSN_UID', 
			[REQ_BY_POSN_CD] varchar(20) '$.REQ_BY_POSN_CD', 
			[REQ_BY_POSN_NAME_ENG] varchar(100) '$.REQ_BY_POSN_NAME_ENG', 
			[REQ_BY_POSN_NAME_CHI] nvarchar(100) '$.REQ_BY_POSN_NAME_CHI', 
			[REQ_DT] datetime '$.REQ_DT', 
			[REQ_RMKS] nvarchar(500) '$.REQ_RMKS', 
			[SEL_APRV_STF_UID] int '$.SEL_APRV_STF_UID', 
			[SEL_APRV_STF_NO] varchar(20) '$.SEL_APRV_STF_NO', 
			[SEL_APRV_STF_NAME_ENG] varchar(50) '$.SEL_APRV_STF_NAME_ENG', 
			[SEL_APRV_STF_NAME_CHI] nvarchar(20) '$.SEL_APRV_STF_NAME_CHI', 
			[SEL_APRV_POSN_UID] int '$.SEL_APRV_POSN_UID', 
			[SEL_APRV_POSN_CD] varchar(20) '$.SEL_APRV_POSN_CD', 
			[SEL_APRV_POSN_NAME_ENG] varchar(100) '$.SEL_APRV_POSN_NAME_ENG', 
			[SEL_APRV_POSN_NAME_CHI] nvarchar(100) '$.SEL_APRV_POSN_NAME_CHI', 
			[APRV_STF_UID] int '$.APRV_STF_UID', 
			[APRV_STF_NO] varchar(20) '$.APRV_STF_NO', 
			[APRV_STF_NAME_ENG] varchar(50) '$.APRV_STF_NAME_ENG', 
			[APRV_STF_NAME_CHI] nvarchar(20) '$.APRV_STF_NAME_CHI', 
			[APRV_POSN_UID] int '$.APRV_POSN_UID', 
			[APRV_POSN_CD] varchar(20) '$.APRV_POSN_CD', 
			[APRV_POSN_NAME_ENG] varchar(100) '$.APRV_POSN_NAME_ENG', 
			[APRV_POSN_NAME_CHI] nvarchar(100) '$.APRV_POSN_NAME_CHI', 
			[APRV_STS] nvarchar(1) '$.APRV_STS', 
			[APRV_DT] datetime '$.APRV_DT', 
			[APRV_RMKS] nvarchar(500) '$.APRV_RMKS', 
			RecordState varchar(1)
		)

		--[CM_ASGN_APRV_REQ]
		IF EXISTS(SELECT 1 FROM #tempAprvReq WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN

			UPDATE #tempAprvReq SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempAprvReq temp
												INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
												WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pAprvReqJson = (SELECT * FROM #tempAprvReq FOR JSON AUTO)
		END


		IF EXISTS (SELECT 1 FROM #tempAprvReq temp
					   INNER JOIN [Census].[CM_ASGN_APRV_REQ] asgnAprvReq WITH (NOLOCK)  ON asgnAprvReq.[ASGN_UID] = temp.[ASGN_UID] 
																		  AND (asgnAprvReq.[APRV_STS] IN ('I', 'P'))
					   WHERE temp.RecordState = 'I') 
		BEGIN
			UPDATE #tempAprvReq SET 
			[RecordState] = 'U',
			[APRV_REQ_UID] = asgnAprvReq.[APRV_REQ_UID]
			FROM #tempAprvReq temp
			INNER JOIN [Census].[CM_ASGN_APRV_REQ] asgnAprvReq ON asgnAprvReq.[ASGN_UID] = temp.[ASGN_UID] AND asgnAprvReq.[APRV_STS] IN ('I', 'P')
			WHERE temp.RecordState = 'I'
		END
		
		IF EXISTS(SELECT 1 FROM #tempAprvReq WHERE [Census].[FN_IntIsNullOrZero]([REQ_BY_STF_UID]) = 1)
		BEGIN
			UPDATE #tempAprvReq SET
			[REQ_BY_STF_NO] = stfProf.[STF_NO],
			[REQ_BY_STF_NAME_ENG] = stfProf.[NAME_ENG],
			[REQ_BY_STF_NAME_CHI] = stfProf.[NAME_CHI]
			FROM #tempAprvReq temp
			INNER JOIN [Census].[CM_STF_PROF] stfProf ON stfProf.[STF_UID] = temp.[REQ_BY_STF_UID]

			set @pAprvReqJson = (SELECT * FROM #tempAprvReq FOR JSON AUTO)
		END

		IF EXISTS(SELECT 1 FROM #tempAprvReq WHERE [Census].[FN_IntIsNullOrZero]([REQ_BY_POSN_UID]) = 1)
		BEGIN
			UPDATE #tempAprvReq SET
			[REQ_BY_POSN_CD] = posn.[POSN_CD],
			[REQ_BY_POSN_NAME_ENG] = posn.[NAME_ENG],
			[REQ_BY_POSN_NAME_CHI] = posn.[NAME_CHI]
			FROM #tempAprvReq temp
			INNER JOIN [Census].[CM_POSN] posn ON posn.[POSN_UID] = temp.[REQ_BY_POSN_UID]

			set @pAprvReqJson = (SELECT * FROM #tempAprvReq FOR JSON AUTO)
		END

		IF EXISTS(SELECT 1 FROM #tempAprvReq WHERE [Census].[FN_IntIsNullOrZero]([SEL_APRV_STF_UID]) = 1)
		BEGIN
			UPDATE #tempAprvReq SET
			[SEL_APRV_STF_NO] = stfProf.[STF_NO],
			[SEL_APRV_STF_NAME_ENG] = stfProf.[NAME_ENG],
			[SEL_APRV_STF_NAME_CHI] = stfProf.[NAME_CHI]
			FROM #tempAprvReq temp
			INNER JOIN [Census].[CM_STF_PROF] stfProf ON stfProf.[STF_UID] = temp.[SEL_APRV_STF_UID]

			set @pAprvReqJson = (SELECT * FROM #tempAprvReq FOR JSON AUTO)
		END

		IF EXISTS(SELECT 1 FROM #tempAprvReq WHERE [Census].[FN_IntIsNullOrZero]([SEL_APRV_POSN_UID]) = 1)
		BEGIN
			UPDATE #tempAprvReq SET
			[SEL_APRV_POSN_CD] = posn.[POSN_CD],
			[SEL_APRV_POSN_NAME_ENG] = posn.[NAME_ENG],
			[SEL_APRV_POSN_NAME_CHI] = posn.[NAME_CHI]
			FROM #tempAprvReq temp
			INNER JOIN [Census].[CM_POSN] posn ON posn.[POSN_UID] = temp.[SEL_APRV_POSN_UID]

			set @pAprvReqJson = (SELECT * FROM #tempAprvReq FOR JSON AUTO)
		END

		IF EXISTS(SELECT 1 FROM #tempAprvReq WHERE [Census].[FN_IntIsNullOrZero]([APRV_STF_UID]) = 1)
		BEGIN
			UPDATE #tempAprvReq SET
			[APRV_STF_NO] = stfProf.[STF_NO],
			[APRV_STF_NAME_ENG] = stfProf.[NAME_ENG],
			[APRV_STF_NAME_CHI] = stfProf.[NAME_CHI]
			FROM #tempAprvReq temp
			INNER JOIN [Census].[CM_STF_PROF] stfProf ON stfProf.[STF_UID] = temp.[APRV_STF_UID]

			set @pAprvReqJson = (SELECT * FROM #tempAprvReq FOR JSON AUTO)
		END

		IF EXISTS(SELECT 1 FROM #tempAprvReq WHERE [Census].[FN_IntIsNullOrZero]([APRV_POSN_UID]) = 1)
		BEGIN
			UPDATE #tempAprvReq SET
			[APRV_POSN_CD] = posn.[POSN_CD],
			[APRV_POSN_NAME_ENG] = posn.[NAME_ENG],
			[APRV_POSN_NAME_CHI] = posn.[NAME_CHI]
			FROM #tempAprvReq temp
			INNER JOIN [Census].[CM_POSN] posn ON posn.[POSN_UID] = temp.[APRV_POSN_UID]

			set @pAprvReqJson = (SELECT * FROM #tempAprvReq FOR JSON AUTO)
		END


		--[CM_ASGN_RMKS] 
		SELECT *
		INTO #tempRmks
		FROM
			OPENJSON(@pRMKJson)
		WITH (
			[ASGN_RMKS_UID] bigint '$.ASGN_RMKS_UID', [ASGN_UID] bigint '$.ASGN_UID', [GUID] uniqueidentifier '$.GUID', [RMKS_CATG] varchar(1) '$.RMKS_CATG', 
			[ASGN_RMKS] nvarchar(1000) '$.ASGN_RMKS', [STS] varchar(1) '$.STS', [CRE_DT] datetime '$.CRE_DT', [CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', 
			[CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', [UPD_DT] datetime '$.UPD_DT', [UPD_BY_USR_ID] varchar(20) '$.UPD_BY_USR_ID', 
			[UPD_BY_STF_POSN_UID] int '$.UPD_BY_STF_POSN_UID', [VER_NO] int '$.VER_NO', RecordState varchar(1), [ASGN_GUID] uniqueidentifier '$.ASGN_GUID'
		)

		--[CM_ASGN_RMKS]: Find the ASGN_UID by ASGN_GUID
		IF EXISTS(SELECT 1 FROM #tempRmks WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN

			UPDATE #tempRmks SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempRmks temp
												INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
												WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pRMKJson = (SELECT * FROM #tempRmks FOR JSON AUTO)
		END
		--[CM_ASGN_RMKS]: Find the [ASGN_RMKS_UID] by GUID
		IF EXISTS(SELECT 1 FROM #tempRmks WHERE RecordState <> 'I' AND [Census].[FN_IntIsNullOrZero]([ASGN_RMKS_UID]) = 0)
		BEGIN

			UPDATE #tempRmks SET [ASGN_RMKS_UID] = asgnRmks.[ASGN_RMKS_UID] FROM #tempRmks temp
												INNER JOIN [Census].[CM_ASGN_RMKS] asgnRmks ON asgnRmks.[GUID] = temp.[GUID]
												WHERE temp.RecordState <> 'I' AND [Census].[FN_IntIsNullOrZero](temp.[ASGN_RMKS_UID]) = 0

			set @pRMKJson = (SELECT * FROM #tempRmks FOR JSON AUTO)
		END


		--[CM_USR_ASGN_BKM]
		SELECT *
		INTO #tempBkm
		FROM
			OPENJSON(@pBKMJson)
		WITH (
			[STF_UID] int '$.STF_UID', [ASGN_UID] bigint '$.ASGN_UID', [RMKS] nvarchar(500) '$.RMKS', [STS] varchar(1) '$.STS', 
			[CRE_DT] datetime '$.CRE_DT', [CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', [CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', [UPD_DT] datetime '$.UPD_DT', 
			[UPD_BY_USR_ID] varchar(20) '$.UPD_BY_USR_ID', [UPD_BY_STF_POSN_UID] int '$.UPD_BY_STF_POSN_UID', RecordState varchar(1), [ASGN_GUID] uniqueidentifier '$.ASGN_GUID'
		)

		IF EXISTS(SELECT 1 FROM #tempBkm WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN

			UPDATE #tempBkm SET [ASGN_UID] = asgn.[ASGN_UID] FROM #tempBkm temp
												INNER JOIN [Census].[CM_ASGN_MAIN] asgn ON asgn.[GUID] = temp.[ASGN_GUID]
												WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0
		END


		UPDATE #tempBkm SET [RecordState] = 'I' FROM #tempBkm temp WHERE temp.RecordState = 'U'
		IF EXISTS(SELECT 1 FROM #tempBkm temp INNER JOIN [Census].[CM_USR_ASGN_BKM] usrAsgnBkm ON usrAsgnBkm.[ASGN_UID] = temp.[ASGN_UID] 
																								AND usrAsgnBkm.[STF_UID] = temp.[STF_UID] 
					WHERE temp.RecordState = 'I')
		BEGIN
			UPDATE #tempBkm SET [RecordState] = 'U' FROM #tempBkm temp
												INNER JOIN [Census].[CM_USR_ASGN_BKM] usrAsgnBkm ON usrAsgnBkm.[ASGN_UID] = temp.[ASGN_UID] 
																								AND usrAsgnBkm.[STF_UID] = temp.[STF_UID] 
												WHERE temp.RecordState = 'I'
		END

		set @pBKMJson = (SELECT * FROM #tempBkm FOR JSON AUTO)
		
		exec census.SP_CM_SET_ASGN_REF_NO @pBaseJson, @pREFNOJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		
		exec census.SP_CM_SET_ASGN_MAP @pBaseJson, @pMapJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		exec census.SP_CM_SET_ASGN_ALLOC @pBaseJson, @pAllocJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		
		exec census.SP_CM_SET_ASGN_ALLOC_HIST @pBaseJson, @sAllocHistJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		
		exec census.SP_CM_SET_ASGN_HH_CONT @pBaseJson, @pHHJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		
		exec census.SP_CM_SET_ASGN_HLD_LST @pBaseJson, @pHldLstJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		
		exec census.SP_CM_SET_ASGN_ACTY @pBaseJson, @pActyJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		exec census.SP_CM_SET_ASGN_RMKS @pBaseJson, @pRMKJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		
		exec census.SP_CM_SET_ASGN_APRV_REQ @pBaseJson, @pAprvReqJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		exec census.SP_CM_SET_ASGN_LTR @pBaseJson, @pLTRJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		exec census.SP_CM_SET_USR_ASGN_BKM @pBaseJson, @pBKMJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		IF @sBeginTranCount = 0 AND @@TRANCOUNT > 0 BEGIN
			IF @sTestMode = 1 BEGIN
				ROLLBACK
			END
			ELSE BEGIN
				COMMIT
			END
		END
		return @pErrCode
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
        SET @sProcedureName = ERROR_PROCEDURE()
	    
		print(ERROR_MESSAGE())
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
			SET @pErrMsg = CONCAT('(', @sErrorNum, ') ', '(', @sProcedureName, ') ', @sCatchErrorMessage)
        END
        ELSE
            THROW
		return @pErrCode

    END CATCH

	DROP TABLE IF EXISTS #tempRmks
	DROP TABLE IF EXISTS #tempRefNo
	DROP TABLE IF EXISTS #tempAsgn
	DROP TABLE IF EXISTS #tempMap
	DROP TABLE IF EXISTS #tempAlloc
	DROP TABLE IF EXISTS #tempAllocHist
	DROP TABLE IF EXISTS #tempHldLst
	DROP TABLE IF EXISTS #tempActy
	DROP TABLE IF EXISTS #tempLtr
	DROP TABLE IF EXISTS #tempHh
	DROP TABLE IF EXISTS #tempBkm
	DROP TABLE IF EXISTS #tempAprvReq

END
