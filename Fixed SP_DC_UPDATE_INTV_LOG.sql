ALTER                 PROCEDURE [Census].[SP_DC_UPDATE_INTV_LOG]
    (
        @pBaseJson        nvarchar(max),
        @pJson            nvarchar(max),
		@pNatureJson      nvarchar(max),
		@pPhotoJson       nvarchar(max),
		@pTimeLogDtlJson  nvarchar(max),
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
	   SET FMTONLY OFF
	END


	DECLARE @sBeginTranCount int = 0,
			@sTestMode	     int = 0,
			@sStaffPositionUID	int

	SET @sBeginTranCount = @@TRANCOUNT

	BEGIN TRY
		IF @sBeginTranCount = 0 BEGIN
			BEGIN TRAN
		END

		SELECT *
		INTO   #BaseJsonDataTable
		FROM
			Census.FN_GetBaseJson(@pBaseJson)

		IF EXISTS(SELECT 1 FROM #BaseJsonDataTable b) BEGIN
            SELECT TOP 1 @sStaffPositionUID = ISNULL(b.StaffPositionUID, 0)
			FROM #BaseJsonDataTable b
        END
		
		SELECT *
		INTO #temp
		FROM
			OPENJSON(@pJson)
		WITH (
			[INTV_LOG_UID] bigint '$.INTV_LOG_UID', 
			[GUID] uniqueidentifier '$.GUID', 
			[ASGN_UID] bigint '$.ASGN_UID', 
			[POSN_UID] int '$.POSN_UID', 
			[STF_UID] int '$.STF_UID', 
			[POSN_CD] varchar(20) '$.POSN_CD', 
			[POSN_NAME_ENG] varchar(100) '$.POSN_NAME_ENG', 
			[POSN_NAME_CHI] nvarchar(100) '$.POSN_NAME_CHI', 
			[STF_NO] varchar(20) '$.STF_NO', 
			[STF_NAME_ENG] varchar(50) '$.STF_NAME_ENG', 
			[STF_NAME_CHI] nvarchar(20) '$.STF_NAME_CHI', 
			[STRT_DT] datetime '$.STRT_DT', 
			[END_DT] datetime '$.END_DT', 
			[STRT_DT_SYS] datetime '$.STRT_DT_SYS', 
			[END_DT_SYS] datetime '$.END_DT_SYS', 
			[HH_CONT_UID] bigint '$.HH_CONT_UID', 
			[ESTB_CONT_UID] bigint '$.ESTB_CONT_UID', 
			[RFS_INTVE_INFO] varchar(1) '$.RFS_INTVE_INFO', 
			[SUBM_DT] datetime '$.SUBM_DT', 
			[INTV_SESS] varchar(2) '$.INTV_SESS', 
			[INTV_MDE] varchar(2) '$.INTV_MDE', 
			[FU_IND] varchar(1) '$.FU_IND', 
			[Q_DATA_VER_NO] int '$.Q_DATA_VER_NO', 
			[TI_FAIL_RSN_CD] varchar(4) '$.TI_FAIL_RSN_CD', 
			[VST_RSLT_CD] varchar(4) '$.VST_RSLT_CD', 
			[VST_RSLT_RMKS] varchar(500) '$.VST_RSLT_RMKS', 
			[ENUM_RSLT_CD] varchar(4) '$.ENUM_RSLT_CD', 
			[ENUM_RSLT_RMKS] nvarchar(500) '$.ENUM_RSLT_RMKS', 
			[INTV_RMKS] nvarchar(1000) '$.INTV_RMKS', 
			[INTV_STS] varchar(1) '$.INTV_STS', 
			[HH_CONT_GUID] uniqueidentifier '$.HH_CONT_GUID', 
			[ASGN_GUID] uniqueidentifier '$.ASGN_GUID',
			UpdateAsgnMainEnumRsltCd varchar(1),
			RecordState varchar(1)
		)

		--Find the [INTV_LOG_UID] by GUID for [CM_INTV_LOG]
		IF EXISTS(SELECT 1 FROM #temp WHERE [Census].[FN_IntIsNullOrZero]([INTV_LOG_UID]) = 0)
		BEGIN
			UPDATE #temp SET [INTV_LOG_UID] = intvLog.[INTV_LOG_UID] FROM #temp temp
											  INNER JOIN [Census].[CM_INTV_LOG] intvLog WITH (NOLOCK) ON intvLog.[GUID] = temp.[GUID]
											  WHERE [Census].[FN_IntIsNullOrZero](temp.[INTV_LOG_UID]) = 0

			set @pJson = (SELECT * FROM #temp FOR JSON AUTO)
		END

		--Find the [INTV_LOG_UID] by GUID for [CM_INTV_LOG]
		IF EXISTS(SELECT 1 FROM #temp WHERE [Census].[FN_IntIsNullOrZero]([ASGN_UID]) = 0)
		BEGIN
			UPDATE #temp SET [ASGN_UID] = asgn.[ASGN_UID] FROM #temp temp
											  INNER JOIN [Census].[CM_ASGN_MAIN] asgn WITH (NOLOCK) ON asgn.[GUID] = temp.[ASGN_GUID]
											  WHERE [Census].[FN_IntIsNullOrZero](temp.[ASGN_UID]) = 0

			set @pJson = (SELECT * FROM #temp FOR JSON AUTO)
		END

		--Find the [HH_CONT_UID] by HH_CONT_GUID
		IF EXISTS(SELECT 1 FROM #temp WHERE [Census].[FN_IntIsNullOrZero]([HH_CONT_UID]) = 0)
		BEGIN
			UPDATE #temp SET [HH_CONT_UID] = asgnHhCont.[HH_CONT_UID] FROM #temp temp
											INNER JOIN [Census].[CM_ASGN_HH_CONT] asgnHhCont WITH (NOLOCK) ON asgnHhCont.[GUID] = temp.[HH_CONT_GUID]
											WHERE [Census].[FN_IntIsNullOrZero](temp.[HH_CONT_UID]) = 0

			set @pJson = (SELECT * FROM #temp FOR JSON AUTO)
		END

		IF EXISTS (
			SELECT 1
			FROM #TEMP
			OUTER APPLY (
				-- Get latest END_DT from CM_INTV_LOG (or NULL if none exists)
				SELECT TOP 1 END_DT
				FROM CENSUS.CM_INTV_LOG WITH (NOLOCK)
				WHERE ASGN_UID = #TEMP.ASGN_UID
				ORDER BY END_DT DESC
			) AS LatestLog
			WHERE
				ISNULL([ENUM_RSLT_CD],'') != ''
				-- Check both scenarios: >= latest END_DT OR END_DT is null
				AND (
					#TEMP.END_DT >= LatestLog.END_DT
					OR LatestLog.END_DT IS NULL
				)
		)
		--BEGIN
					
			--DECLARE @sAsgnMainEnumRsltJson nvarchar(max) = (
			--	SELECT ISNULL(intvLog.[ASGN_UID], #temp.[ASGN_UID]) [ASGN_UID],
			--		CASE
			--			WHEN #temp.[UpdateAsgnMainEnumRsltCd] = 'N' THEN NULL
			--			ELSE #temp.[ENUM_RSLT_CD]
			--		END [ENUM_RSLT_CD],
			--		#temp.[ENUM_RSLT_RMKS],
			--		--[NCD_FC_SUM]
			--		CASE 
			--			WHEN #temp.[ENUM_RSLT_CD] = 'NC' AND ISNULL(intvLog.[ENUM_RSLT_CD], '') <> 'NC' 
			--			AND (ISNULL(#temp.[INTV_SESS], intvLog.[INTV_SESS]) = 'AM' 
			--				OR ISNULL(#temp.[INTV_SESS], intvLog.[INTV_SESS]) = 'PM' )
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) = 'F'
			--			THEN ISNULL(asgn.[NCD_FC_SUM], 0) + 1
			--			WHEN  #temp.[ENUM_RSLT_CD] <> 'NC' AND intvLog.[ENUM_RSLT_CD] = 'NC' 
			--			AND (intvLog.[INTV_SESS] = 'AM' OR intvLog.[INTV_SESS] = 'PM' )
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) = 'F'
			--			THEN asgn.[NCD_FC_SUM] - 1
			--		END [NCD_FC_SUM],
			--		--[NCD_CSC_SUM]
			--		CASE 
			--			WHEN #temp.[ENUM_RSLT_CD] = 'NC' AND ISNULL(intvLog.[ENUM_RSLT_CD], '') <> 'NC' 
			--			AND (ISNULL(#temp.[INTV_SESS], intvLog.[INTV_SESS]) = 'AM' 
			--				OR ISNULL(#temp.[INTV_SESS], intvLog.[INTV_SESS]) = 'PM' )
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) in ('TI(out)', 'TI(in)')
			--			THEN ISNULL(asgn.[NCD_CSC_SUM], 0) + 1
			--			WHEN  #temp.[ENUM_RSLT_CD] <> 'NC' AND intvLog.[ENUM_RSLT_CD] = 'NC' 
			--			AND (intvLog.[INTV_SESS] = 'AM' OR intvLog.[INTV_SESS] = 'PM' )
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) in ('TI(out)', 'TI(in)')
			--			THEN asgn.[NCD_CSC_SUM] - 1
			--		END [NCD_CSC_SUM],
			--		--[NCN_FC_SUM]
			--		CASE 
			--			WHEN #temp.[ENUM_RSLT_CD] = 'NC' AND ISNULL(intvLog.[ENUM_RSLT_CD], '') <> 'NC' 
			--			AND ISNULL(#temp.[INTV_SESS], intvLog.[INTV_SESS]) = 'EV'
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) = 'F'
			--			THEN ISNULL(asgn.[NCN_FC_SUM], 0) + 1
			--			WHEN  #temp.[ENUM_RSLT_CD] <> 'NC' AND intvLog.[ENUM_RSLT_CD] = 'NC' 
			--			AND intvLog.[INTV_SESS] = 'EV'
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) = 'F'
			--			THEN asgn.[NCN_FC_SUM] - 1
			--		END [NCN_FC_SUM],
			--		--[NCN_CSC_SUM]
			--		CASE 
			--			WHEN #temp.[ENUM_RSLT_CD] = 'NC' AND ISNULL(intvLog.[ENUM_RSLT_CD], '') <> 'NC' 
			--			AND ISNULL(#temp.[INTV_SESS], intvLog.[INTV_SESS]) = 'EV'
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) in ('TI(out)', 'TI(in)')
			--			THEN ISNULL(asgn.[NCN_CSC_SUM], 0) + 1
			--			WHEN  #temp.[ENUM_RSLT_CD] <> 'NC' AND intvLog.[ENUM_RSLT_CD] = 'NC' 
			--			AND intvLog.[INTV_SESS] = 'EV'
			--			AND ISNULL(intvLog.[INTV_MDE], #temp.[INTV_MDE]) in ('TI(out)', 'TI(in)')
			--			THEN asgn.[NCN_CSC_SUM] - 1
			--		END [NCN_CSC_SUM],
			--		'U' [RecordState]
			--	FROM #temp
			--	LEFT JOIN [Census].[CM_INTV_LOG] intvLog  WITH (NOLOCK) ON #temp.[INTV_LOG_UID] = intvLog.[INTV_LOG_UID]
			--	LEFT JOIN [Census].[CM_ASGN_MAIN] asgn  WITH (NOLOCK) ON asgn.[ASGN_UID] = ISNULL(#temp.[ASGN_UID], intvLog.[ASGN_UID])
			--	WHERE #temp.[ENUM_RSLT_CD] IS NOT NULL
			--	FOR JSON PATH
			--)

			--exec census.SP_CM_SET_ASGN_MAIN @pBaseJson, @sAsgnMainEnumRsltJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		--END
		

		IF EXISTS (SELECT 1 FROM #temp WHERE [RecordState] = 'D')
		BEGIN
			DECLARE @sAsgnMainJson nvarchar(max) = (
				SELECT asgn.[ASGN_UID],
					   CASE WHEN intvLog.[INTV_SESS] = 'EV' AND intvLog.[INTV_MDE] in ('TI(out)', 'TI(in)') THEN asgn.[NCN_CSC_SUM] - 1 ELSE NULL END AS [NCN_CSC_SUM],
					   CASE WHEN intvLog.[INTV_SESS] = 'EV' AND intvLog.[INTV_MDE] = 'F'THEN asgn.[NCN_FC_SUM] - 1 ELSE NULL END AS [NCN_FC_SUM],
					   CASE WHEN intvLog.[INTV_SESS] in ('AM', 'PM') AND intvLog.[INTV_MDE] in ('TI(out)', 'TI(in)') THEN asgn.[NCD_CSC_SUM] - 1 ELSE NULL END AS [NCD_CSC_SUM],
					   CASE WHEN intvLog.[INTV_SESS] in ('AM', 'PM') AND intvLog.[INTV_MDE] = 'F'THEN asgn.[NCD_FC_SUM] - 1 ELSE NULL END AS [NCD_FC_SUM],
					   'U' [RecordState]
				FROM #temp 
				INNER JOIN [Census].[CM_INTV_LOG] intvLog  WITH (NOLOCK) ON intvLog.[INTV_LOG_UID] = #temp.[INTV_LOG_UID] AND intvLog.[ENUM_RSLT_CD] = 'NC'
				INNER JOIN [Census].[CM_ASGN_MAIN] asgn  WITH (NOLOCK) ON asgn.[ASGN_UID] = intvLog.[ASGN_UID]
				WHERE [RecordState] = 'D'
				FOR JSON PATH
			)

			exec census.SP_CM_SET_ASGN_MAIN @pBaseJson, @sAsgnMainJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		END

		IF EXISTS(SELECT 1 FROM #temp WHERE [RecordState] = 'I' AND @sStaffPositionUID IS NOT NULL)
		BEGIN
			UPDATE #temp SET
			[POSN_UID]		= posn.[POSN_UID],
			[POSN_CD]		= posn.[POSN_CD],
			[POSN_NAME_ENG] = posn.[NAME_ENG],
			[POSN_NAME_CHI] = posn.[NAME_CHI],
			[STF_UID]		= stfProf.[STF_UID],
			[STF_NO]		= stfProf.[STF_NO],
			[STF_NAME_ENG]	= stfProf.[NAME_ENG],
			[STF_NAME_CHI]	= stfProf.[NAME_CHI]
			FROM [Census].[VW_CM_GET_CURR_STF_POSN] stfPosn
			INNER JOIN [Census].[CM_STF_PROF] stfProf WITH (NOLOCK) ON stfProf.[STF_UID] = stfPosn.[STF_UID]
			INNER JOIN [Census].[CM_POSN] posn WITH (NOLOCK) ON posn.[POSN_UID] = stfPosn.[POSN_UID]
			WHERE stfPosn.[STF_POSN_UID] = @sStaffPositionUID

			set @pJson = (SELECT * FROM #temp FOR JSON AUTO)
		END
		
		--CM_ASGN_HH_CONT, update the interviewLog indicator to 'YES'
		DECLARE @pHHJson nvarchar(max)

		CREATE TABLE #tempHh(
			[HH_CONT_UID] bigint, 
			[INTV_IND] varchar(1), 
			[RecordState] varchar(1)
		)

		INSERT INTO #tempHh ([HH_CONT_UID])
		SELECT enqLog.[HH_CONT_UID]
		FROM #temp enqLog

		UPDATE #tempHh SET [RecordState]  = 'U'
		UPDATE #tempHh SET [INTV_IND]  = 'Y'

		SET @pHHJson = (SELECT * FROM #tempHh FOR JSON PATH)

		exec Census.SP_CM_SET_ASGN_HH_CONT @pBaseJson, @pHHJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		--END update CM_ASGN_HH_CONT

		exec census.SP_CM_SET_INTV_LOG @pBaseJson, @pJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

		-- Get distinct ASGN_UIDs affected
		SELECT DISTINCT ASGN_UID INTO #AffectedAsgn FROM #temp WHERE ASGN_UID IS NOT NULL;

		-- Recalculate and update for each 
		DECLARE @AsgnUid bigint;
		SELECT TOP 1 @AsgnUid = ASGN_UID FROM #temp WHERE ASGN_UID IS NOT NULL;

		IF @AsgnUid IS NOT NULL
		BEGIN
			DECLARE @NCD_FC_SUM int = 0, @NCN_FC_SUM int = 0, @NCD_CSC_SUM int = 0, @NCN_CSC_SUM int = 0;

			SELECT 
				@NCD_FC_SUM = ISNULL(SUM(CASE WHEN ENUM_RSLT_CD = 'NC' AND INTV_SESS IN ('AM', 'PM') AND INTV_MDE = 'F' THEN 1 ELSE 0 END), 0),
				@NCN_FC_SUM = ISNULL(SUM(CASE WHEN ENUM_RSLT_CD = 'NC' AND INTV_SESS = 'EV' AND INTV_MDE = 'F' THEN 1 ELSE 0 END), 0),
				@NCD_CSC_SUM = ISNULL(SUM(CASE WHEN ENUM_RSLT_CD = 'NC' AND INTV_SESS IN ('AM', 'PM') AND INTV_MDE IN ('TI(out)', 'TI(in)') THEN 1 ELSE 0 END), 0),
				@NCN_CSC_SUM = ISNULL(SUM(CASE WHEN ENUM_RSLT_CD = 'NC' AND INTV_SESS = 'EV' AND INTV_MDE IN ('TI(out)', 'TI(in)') THEN 1 ELSE 0 END), 0)
			FROM [Census].[CM_INTV_LOG] WITH (UPDLOCK)
			WHERE ASGN_UID = @AsgnUid;

			DECLARE @UpdateJson nvarchar(max) = (
				SELECT 
					@AsgnUid AS [ASGN_UID],
					@NCD_FC_SUM AS [NCD_FC_SUM],
					@NCN_FC_SUM AS [NCN_FC_SUM],
					@NCD_CSC_SUM AS [NCD_CSC_SUM],
					@NCN_CSC_SUM AS [NCN_CSC_SUM],
					'U' AS [RecordState]
				FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
			);

			SET @UpdateJson = N'[' + @UpdateJson + N']';

			EXEC [Census].[SP_CM_SET_ASGN_MAIN] @pBaseJson, @UpdateJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;

			IF @pErrCode <> 0 RAISERROR(@pErrMsg, 16, 1);
		END


		--Assignment Activity
		IF EXISTS (SELECT 1 FROM #temp WHERE [INTV_MDE] in ('TI', 'TO'))
		BEGIN

			DECLARE @sWfActyUid_R int = (SELECT TOP(1) [ACTY_UID] FROM [Census].[CM_REF_ASGN_ACTY] WITH (NOLOCK)  WHERE [ACTY_CD] = '13')
			DECLARE @sWfActyUid_N int = (SELECT TOP(1) [ACTY_UID] FROM [Census].[CM_REF_ASGN_ACTY] WITH (NOLOCK)  WHERE [ACTY_CD] = '12')
			
			SELECT top 1 asgn.[ASGN_UID],
				   iif(asgn.[RFS_INTVE_INFO] = 'R',@sWfActyUid_R, @sWfActyUid_N) as [ACTY_UID],
				   iif(asgn.[RFS_INTVE_INFO] = 'R','Refused to provide interviewee information', 'Willing to provide interviewee information') as [OTH_DESCR],
				   'I' [RecordState]
			into #tempAsgnActy
			FROM #temp asgn
			WHERE [INTV_MDE] in ('TI', 'TO')

			DECLARE @sAsgnActyJson nvarchar(max) = (SELECT * FROM #tempAsgnActy FOR JSON PATH)

			exec census.SP_CM_SET_ASGN_ACTY @pBaseJson, @sAsgnActyJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		END

		SELECT [INTV_LOG_UID]
		INTO #sDataSet_SetCM_INTV_LOG_Result
		FROM
			OPENJSON(@pResultJson)
		WITH 
		(
			[INTV_LOG_UID] bigint '$.INTV_LOG_UID'
		)

		SELECT * 
		into #temp_Nature
		FROM
			OPENJSON(@pNatureJson)
		WITH 
		(
			[INTV_LOG_UID] bigint '$.INTV_LOG_UID', [CN_UID] int '$.CN_UID', [OTH_DESCR] nvarchar(250) '$.OTH_DESCR', [CRE_DT] datetime '$.CRE_DT', [CRE_BY_USR_ID] varchar(20) '$.CRE_BY_USR_ID', [CRE_BY_STF_POSN_UID] int '$.CRE_BY_STF_POSN_UID', [CRE_SYS_CD] varchar(5) '$.CRE_SYS_CD', [UPD_DT] datetime '$.UPD_DT', [UPD_BY_USR_ID] varchar(20) '$.UPD_BY_USR_ID', [UPD_BY_STF_POSN_UID] int '$.UPD_BY_STF_POSN_UID', [UPD_SYS_CD] varchar(5) '$.UPD_SYS_CD', [VER_NO] int '$.VER_NO', RecordState varchar(1)
		)

		UPDATE #temp_Nature SET [INTV_LOG_UID] = (select top 1 [INTV_LOG_UID] from #sDataSet_SetCM_INTV_LOG_Result) where RecordState = 'I';

		set @pNatureJson = (SELECT * FROM #temp_Nature FOR JSON AUTO)

		SELECT * into #tempPhoto
		FROM
			OPENJSON(@pPhotoJson)
		WITH 
		(
			[INTV_LOG_UID] bigint '$.INTV_LOG_UID', [FILE_NAME] nvarchar(250) '$.FILE_NAME', [FILE_PATH] nvarchar(500) '$.FILE_PATH', [FILE_DESCR] nvarchar(250) '$.FILE_DESCR', 
			RecordState varchar(1), [GUID] uniqueidentifier '$.GUID', [INTV_LOG_GUID] uniqueidentifier '$.INTV_LOG_GUID'
		)

		UPDATE #tempPhoto SET [INTV_LOG_UID] = intvLogPht.[INTV_LOG_UID], 
								[FILE_NAME]	  = intvLogPht.[FILE_NAME] 
							  	FROM #tempPhoto temp
								INNER JOIN [Census].[CM_INTV_LOG_PHT] intvLogPht WITH (NOLOCK) ON intvLogPht.[GUID] = temp.[GUID]
								WHERE RecordState <> 'I'



		IF EXISTS(SELECT 1 FROM #tempPhoto WHERE [Census].[FN_IntIsNullOrZero]([INTV_LOG_UID]) = 0)
		BEGIN
			UPDATE #tempPhoto SET [INTV_LOG_UID] = intvLog.[INTV_LOG_UID]
								FROM #tempPhoto temp
								INNER JOIN [Census].[CM_INTV_LOG] intvLog WITH (NOLOCK) ON intvLog.[GUID] = temp.[INTV_LOG_GUID]
								WHERE [Census].[FN_IntIsNullOrZero](temp.[INTV_LOG_UID]) = 0
		END

		set @pPhotoJson = (SELECT * FROM #tempPhoto FOR JSON AUTO)

		SELECT * 
		into #temp_TimeDetailLog
		FROM
			OPENJSON(@pTimeLogDtlJson)
		WITH 
		(
			[TM_LOG_DTL_UID]bigint '$.TM_LOG_DTL_UID',
			[INTV_LOG_UID] bigint '$.INTV_LOG_UID',
			[STRT_DT] datetime '$.STRT_DT', 
			[END_DT] datetime '$.END_DT',
			[ACTY_CD] varchar(2) '$.ACTY_CD',
			[ENUM_RSLT_CD] varchar(4) '$.ENUM_RSLT_CD',
			[DEST_TO] nvarchar(500) '$.DEST_TO',
			[RMKS] nvarchar(500) '$.RMKS',
            [GUID] uniqueidentifier '$.GUID',
			RecordState varchar(1) '$.RecordState'
		)

		--Find the [TM_LOG_DTL_UID] by GUID for [CM_TM_LOG_DTL]
		IF EXISTS(SELECT 1 FROM #temp_TimeDetailLog WHERE [Census].[FN_IntIsNullOrZero]([TM_LOG_DTL_UID]) = 0)
		BEGIN
			UPDATE #temp_TimeDetailLog SET [TM_LOG_DTL_UID] = tmLogDtl.[TM_LOG_DTL_UID] 
			FROM #temp_TimeDetailLog temp
			INNER JOIN [Census].[CM_TM_LOG_DTL] tmLogDtl WITH (NOLOCK) ON tmLogDtl.[GUID] = temp.[GUID]
			WHERE [Census].[FN_IntIsNullOrZero](temp.[TM_LOG_DTL_UID]) = 0
		END

		UPDATE #temp_TimeDetailLog SET [INTV_LOG_UID] = temp.[INTV_LOG_UID] FROM #temp temp

		set @pTimeLogDtlJson = (
			SELECT 
				[TM_LOG_DTL_UID],
				[INTV_LOG_UID],
				[STRT_DT],
				[END_DT],
				[ACTY_CD],
				[ENUM_RSLT_CD],
				[DEST_TO],
				[RMKS],
				[RecordState]
			FROM #temp_TimeDetailLog 
			FOR JSON AUTO
		);
		
		IF NOT EXISTS
		(
			SELECT 1 FROM CENSUS.CM_TM_LOG_DTL tmdtl 
			LEFT JOIN CENSUS.CM_TM_LOG tm WITH (NOLOCK) ON tm.TM_LOG_UID = tmdtl.TM_LOG_UID
			LEFT JOIN #temp_TimeDetailLog insertTmDtl on insertTmDtl.TM_LOG_DTL_UID = tmdtl.TM_LOG_DTL_UID
			WHERE tm.TM_LOG_STS = 'A' AND insertTmDtl.RecordState = 'U'
		)
		BEGIN
			exec census.SP_CM_SET_TM_LOG_DTL @pBaseJson, @pTimeLogDtlJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		END

		exec census.SP_CM_SET_INTV_LOG_NATUR @pBaseJson, @pNatureJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		exec census.SP_CM_SET_INTV_LOG_PHT @pBaseJson, @pPhotoJson, @pResultJson OUTPUT, @pErrCode OUTPUT, @pErrMsg OUTPUT;
		

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
			SET @pErrMsg = CONCAT('(', @sErrorNum, ') ', @sCatchErrorMessage)
        END
        ELSE
            THROW

    END CATCH

	DROP TABLE IF EXISTS #tempHh
	DROP TABLE IF EXISTS #temp
END
